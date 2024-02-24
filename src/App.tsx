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

	const [amount, setAmount] = React.useState<number>(0);
	const [receiveAddress, setReceiveAddress] = React.useState<string>('sam@lawallet.ar');

	const [generatedInvoice, setGeneratedInvoice] = React.useState<string>()

	const [broadcastMode, setBroadcastMode] = React.useState<'single' | 'batch'>('single');
	const [heardContent, setHeardContent] = React.useState<string>('')
	const [isListening, setIsListening] = React.useState<boolean>(false)


	const setUpQuiet = async () => {
		if (quiet === undefined) {
			console.log('REGISTERING QUIET')
			const quietInstance = await new Quiet(
				audioContext,
				quietProfiles.audible,
			).init();

			// quietInstance.receive(({value}: {value: string}) => {
			//   console.log(value)
			//   // if (isListening) {
			//     setHeardContent((prevHeardContent) => prevHeardContent + value);
			//   // }
			// });

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

	// const toggleListening = () => {
	//   if (isListening) {
	//     setIsListening(false)
	//   } else {
	//     setHeardContent('')
	//     setIsListening(true)
	//   }
	// }


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


	const makeInvoice = async () => {
		if (window.webln) {

			const ln = new ALbyLightningTools.LightningAddress(receiveAddress);
			await ln.fetch();

			const invoice = await ln.requestInvoice({ satoshi: amount });

			console.log(invoice.paymentRequest); // print the payment request
			console.log(invoice.paymentHash); // print the payment hash

			// this must be in the event, the previous stuff can be re-used
			if (quiet) {
				const invoiceString = invoice.paymentRequest
				setGeneratedInvoice(invoiceString)



				if (broadcastMode === 'single') {
					// @ts-ignore
					quiet.transmit({
						clampFrame: false,
						// clampFrame: true,
						payload: invoiceString,
					});
				} else if (broadcastMode === 'batch') {
					const chunks = splitStringIntoVariableChunks(invoiceString, 3, 24)

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
				// if (isListening) {
				setHeardContent((prevHeardContent) => prevHeardContent + value);
				tryToParseInvoice()
				// }
			});
			console.log('listener registered')
		}
	}

	const tryToParseInvoice = () => {

		const invoice = (() => {
			try {
				const invoice = new ALbyLightningTools.Invoice({ pr: heardContent });
				return invoice
			} catch (e) {
				// don't care about the error
				console.log('silent error')
				return undefined
			}
		})()

		console.log('invoice amount: ', invoice?.satoshi)
	}



	const tryToPayInvoice = async () => {

		// @ts-ignore
		const paymentAttempt = await window.webln.sendPayment(heardContent);

		console.log('payment attempt', paymentAttempt)
	}

	return (
		<div>
			<h2>Lightning / thunder</h2>

			<h3>Convert Lightning (&#9889;) &rarr; thunder (&#128227;&#127785;)</h3>
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
				<textarea style={{ width: '100%' }} value={generatedInvoice} />

				<button onClick={makeInvoice}>broadcast ⚡</button>
			</div>
			<p>length: {generatedInvoice?.length}</p>
			<hr />


			<h3>Convert Thunder (&#127785;👂) to Lightning (&#9889;)</h3>
			{/* <button onClick={toggleListening}>{String(isListening)}</button><br/> */}
			<button onClick={registerListener}>Listen for something</button><br />


			<p style={{ wordWrap: 'break-word', maxWidth: '100%' }}>
				{heardContent}</p>
			<p>length: {heardContent?.length}</p>
			<button onClick={tryToParseInvoice}>try to decode</button><br />
			<button onClick={tryToPayInvoice}>try to pay</button>
		</div>
	);
}

export default App;
