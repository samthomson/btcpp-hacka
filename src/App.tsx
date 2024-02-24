import React from 'react';
import type * as WebLNTypes from "@webbtc/webln-types";
// import quiet from 'quietjs-bundle'
// @ts-ignore
import Quiet from '@moxon6/quiet-js';
// @ts-ignore
import quietProfiles from '@moxon6/quiet-js/profiles';


const audioContext = new AudioContext();

const App = () => {

  const [quiet, setQuiet] = React.useState(undefined)

  const [generatedInvoice, setGeneratedInvoice] = React.useState<string>()

  const [heardContent, setHeardContent] = React.useState<string>('')
  const [isListening, setIsListening] = React.useState<boolean>(false)


  const setUpQuiet = async () => {
    if (quiet === undefined) {
      console.log('REGISTERING QUIET')
      const quietInstance = await new Quiet(
        audioContext,
        quietProfiles.audible,
      ).init();

      quietInstance.receive(({value}: {value: string}) => {
        console.log(value)
        // if (isListening) {
          setHeardContent((prevHeardContent) => prevHeardContent + value);
        // }
      });

      setQuiet(quietInstance)
    }
  }

  React.useEffect(() => {
    setUpQuiet()
  }, [])

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false)
    } else {
      setHeardContent('')
      setIsListening(true)
    }
  }
  

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
      (async () => {
        // @ts-ignore
        await window.webln.enable();
        
        // @ts-ignore
        const invoice = await window.webln.makeInvoice({
          amount: 2121,
        });

        const invoiceString = invoice.paymentRequest

        console.log('invoiceString', invoiceString)
        

        // this must be in the event, the previous stuff can be re-used
        if (quiet) {
          setGeneratedInvoice(invoiceString)

          const chunks = splitStringIntoVariableChunks(invoiceString, 3, 24)

          for (let i = 0 ; i < chunks.length; i++) {
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

      })();
    } else {
      console.warn("WebLN not enabled");
    }
  }

  return (
    <div>
     [todo: build app]
     <p>
      <button onClick={makeInvoice}>make invoice</button>
      </p>
      <p style={{ wordWrap: 'break-word', maxWidth: '100%' }}>{generatedInvoice}</p>
      <p>length: {generatedInvoice?.length}</p>
     <hr/>
     <button onClick={toggleListening}>{String(isListening)}</button><br/>
     <p style={{ wordWrap: 'break-word', maxWidth: '100%' }}>
     {heardContent}</p>
      <p>length: {heardContent?.length}</p>
     <hr />
     {generatedInvoice === heardContent ? 'MATCH' : 'NOT THE SAME'}
    </div>
  );
}

export default App;
