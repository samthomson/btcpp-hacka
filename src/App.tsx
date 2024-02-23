import React from 'react';
import type * as WebLNTypes from "@webbtc/webln-types";

function App() {

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
    </div>
  );
}

export default App;
