import React from 'react';
import type * as WebLNTypes from "@webbtc/webln-types";
// import quiet from 'quietjs-bundle'
// @ts-ignore
import Quiet from '@moxon6/quiet-js';
// @ts-ignore
import quietProfiles from '@moxon6/quiet-js/profiles';
import * as ALbyLightningTools from "@getalby/lightning-tools"

const audioContext = new AudioContext();

const App = () => {

	const [quiet, setQuiet] = React.useState(undefined)

	const [uiIsBroadcastMode, setUIIsBroadcastMode] = React.useState(true)

	const [amount, setAmount] = React.useState<number>(0);
	const [receiveAddress, setReceiveAddress] = React.useState<string>(''); //sam@lawallet.ar

	const [generatedInvoice, setGeneratedInvoice] = React.useState<string>()

	const [broadcastMode, setBroadcastMode] = React.useState<'single' | 'batch'>('single');
	const [heardContent, setHeardContent] = React.useState<string>('')
	const [isListening, setIsListening] = React.useState<boolean>(false)
	const [isDecoding, setIsDecoding] = React.useState<boolean>(false)

	const timeoutRef = React.useRef<NodeJS.Timeout | number | null>(null);
	const [parsedInvoice, setParsedInvoice] = React.useState<ALbyLightningTools.Invoice | undefined>(undefined)


	const setUpQuiet = async () => {
		if (quiet === undefined) {
			console.log('REGISTERING QUIET')
			const quietInstance = await new Quiet(
				audioContext,
				quietProfiles.audible,
			).init();

			setQuiet(quietInstance)
		}
	}

	const setupWebLN = async () => {
		// @ts-ignore
		await window.webln.enable();
	}

	React.useEffect(() => {
		setupWebLN()
		setUpQuiet()
	}, [])

	const generateInvoice = async () => {
		console.log('hook firing', { amount, receiveAddress })
		if (amount > 0 && !!receiveAddress) {
			setGeneratedInvoice('.. loading ...')
			const ln = new ALbyLightningTools.LightningAddress(receiveAddress);
			await ln.fetch();

			const invoice = await ln.requestInvoice({ satoshi: amount });

			// console.log(invoice.paymentRequest);
			// console.log(invoice.paymentHash); 

			const invoiceString = invoice.paymentRequest
			setGeneratedInvoice(invoiceString)
		}
	}

	React.useEffect(() => {
		generateInvoice()
	}, [amount, receiveAddress])



	const splitStringIntoVariableChunks = (str: string, minChunkLength: number, maxChunkLength: number): string[] => {
		const result: string[] = [];
		let i = 0;
		while (i < str.length) {
			const chunkLength = Math.floor(Math.random() * (maxChunkLength - minChunkLength + 1)) + minChunkLength;
			const end = Math.min(i + chunkLength, str.length);
			result.push(str.substring(i, end));
			i += chunkLength;
		}
		return result;
	}


	const broadcastInvoice = async () => {
		if (window.webln && !!generatedInvoice) {

			// const ln = new ALbyLightningTools.LightningAddress(receiveAddress);
			// await ln.fetch();

			// const invoice = await ln.requestInvoice({ satoshi: amount });

			// this must be in the event, the previous stuff can be re-used
			if (quiet) {
				// const invoiceString = invoice.paymentRequest
				// setGeneratedInvoice(invoiceString)



				if (broadcastMode === 'single') {
					// @ts-ignore
					quiet.transmit({
						clampFrame: false,
						// clampFrame: true,
						payload: generatedInvoice,
					});
				} else if (broadcastMode === 'batch') {
					const chunks = splitStringIntoVariableChunks(generatedInvoice, 3, 24)

					for (let i = 0; i < chunks.length; i++) {
						// @ts-ignore
						quiet.transmit({
							clampFrame: false,
							// clampFrame: true,
							// payload: invoiceString,
							payload: chunks[i],
						});
						await new Promise(resolve => setTimeout(resolve, 300))
					}
				}


			}

		} else {
			console.warn("WebLN not enabled");
		}
	}


	const registerListener = () => {
		setHeardContent('')

		if (!!quiet) {
			// @ts-ignore
			quiet.receive(({ value }: { value: string }) => {
				console.log(value)
				setHeardContent((prevHeardContent) => prevHeardContent + value);
			});
			setIsListening(true)
			console.log('listener registered')
		}
	}

	React.useEffect(() => {
		if (heardContent?.length > 0) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			timeoutRef.current = setTimeout(() => {
				tryToParseInvoice();
			}, 300);
		}
	}, [heardContent])

	const tryToParseInvoice = React.useCallback(() => {
		console.log('tryToParseInvoice', heardContent.length)
		setIsDecoding(true)

		try {
			const invoice = new ALbyLightningTools.Invoice({ pr: heardContent });
			// return invoice
			setParsedInvoice(invoice)
			setIsDecoding(false)
		} catch (e) {
			// don't care about the error
			console.log('silent error parsing invoice')
			// return undefined
			setIsDecoding(false)
		}
	}, [heardContent])



	const tryToPayInvoice = async () => {

		// @ts-ignore
		const paymentAttempt = await window.webln.sendPayment(heardContent);

		console.log('payment attempt', paymentAttempt)
	}

	return (
		<div>
			<h2>Lightning / thunder</h2>
			<hr />
			<button disabled={uiIsBroadcastMode} onClick={() => setUIIsBroadcastMode(true)}>BROADCAST</button>&nbsp;-&nbsp;OR&nbsp;-&nbsp;&nbsp;&nbsp;<button disabled={!uiIsBroadcastMode} onClick={() => setUIIsBroadcastMode(false)}>LISTEN</button>
			<hr />
			{uiIsBroadcastMode && <>
				<h3>Convert Lightning (&#9889;) &rarr; thunder (&#127785;&nbsp;<span style={{ display: 'inline-block', transform: "scaleX(-1)" }}>&#128227;</span>)</h3>
				<div>
					receive to:&nbsp;&nbsp;&nbsp;&nbsp;
					<input
						type="text"
						placeholder="My address"
						value={receiveAddress}
						onChange={(e) => setReceiveAddress(e.target.value)}
					/><br /><br />
					sat amount:&nbsp;&nbsp;
					<input
						type="number"
						placeholder="Amount"
						value={amount}
						onChange={(e) => setAmount(Number(e.target.value))}
					/><br /><br />

					<textarea style={{ width: '100%', height: '60px' }} value={generatedInvoice} disabled={true} />

					<p>length: {!!generatedInvoice && generatedInvoice?.length > 20 ? generatedInvoice.length : '?'}</p>

					<p>
						Broadcast mode:
						<label>
							<input
								type="radio"
								value="single"
								checked={broadcastMode === 'single'}
								onChange={(e) => setBroadcastMode('single')}
							/>
							Single
						</label>
						&nbsp;&nbsp;
						<label>
							<input
								type="radio"
								value="batch"
								checked={broadcastMode === 'batch'}
								onChange={(e) => setBroadcastMode('batch')}
							/>
							Batch
						</label>
					</p>

					<button onClick={broadcastInvoice} disabled={!generatedInvoice || generatedInvoice.length < 20}><h3>broadcast <span style={{ display: 'inline-block', transform: "scaleX(-1)" }}>&#128227;</span></h3></button>
				</div>
			</>}


			{!uiIsBroadcastMode && <>
				<h3>Convert Thunder (&#127785;👂) to Lightning (&#9889;)</h3>
				<button onClick={registerListener} disabled={isListening}><h3>👂{!isListening ? 'Listen for something' : 'Listening...'}</h3></button><br />

				{isListening && <>

					<textarea style={{ width: '100%', height: '60px', overflowY: 'auto' }} value={heardContent} disabled={true} />
					<p>length: {heardContent?.length}</p>
					<p>
						<button onClick={tryToParseInvoice} disabled={isDecoding || heardContent?.length === 0 || !!parsedInvoice}>{isDecoding ? 'decoding ...' : 'decode'}</button>
					</p>
					<button onClick={tryToPayInvoice} disabled={!parsedInvoice}>⚡ {parsedInvoice?.satoshi ? `${parsedInvoice.satoshi} sats` : ''}</button>
				</>}
			</>}
		</div>
	);
}

export default App;
