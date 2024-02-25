# btcpp-hacka - thunder

Take a lightning invoice and broadcast it encoded in audio. Separately listen for such a broadcast and decode it to a lightning invoice.
Pay the invoice via webln.

## How to use

### 1. make an invoice

First compose an invoice, once it's ready it can be broadcast (turn your volume ON):

![Compose](/docs/compose-broadcast.png)

### 2. hear/decode - and fill - the invoice

Be sure to have this pane open, and listening before you broadcast as above:

![Listen / Fill](/docs/receive-fulfill.png)

## How to work on it

`yarn` or whatever js package manager to install things - it's just a single page react/js (or ts) app.

Excuse the very unrefactored messy code - this was put together kind of fast.

### Some ideas to extend

- supersonic
- better error handling (maybe first broadcast how much data is expected?)
- figure out how to send data in as short an amount of time as possible
- adapt/test for/on non-smart phones, or other devies altogether (so far it's just tested on a decent laptop)
