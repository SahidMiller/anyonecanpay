declare module "@psf/bch-js" {
  const any:any;
  export = any;
}

declare module "@psf/bch-js/src/crypto.js"
declare module "@psf/bch-js/src/script.js"
declare module "@psf/bch-js/src/address.js"
declare module "@psf/bch-js/src/hdnode.js"
declare module "@psf/bch-js/src/bitcoincash.js"
declare module "@psf/bch-js/src/transaction-builder.js"
declare module "@psf/bch-js/src/ecpair.js"
declare module "@psf/bitcoincashjs-lib/src/ecsignature.js"


declare module "@psf/bitcoincashjs-lib" {
  export interface HDNode {
    keyPair: any
    getAddress(): any
    isNeutered(): any
    getIdentifier(): any
    verify(buffer: any, signature: any): any
    deriveHardened(path: any): any
    sign(buffer: any): any
    toBase58(): any
    neutered(): any
    getPublicKeyBuffer(): any
    derivePath(path: any): any
    derive(path: any): any
  }

  export interface ECPair {
    toWIF(): string
    sign(buffer: Buffer, signatureAlgorithm?: number): Boolean | ECSignature
    verify(buffer: Buffer, signature: ECSignature): boolean
    getPublicKeyBuffer(): Buffer
    getAddress(): string
  }

  export type ECSignature = any
  
  export interface TransactionPoint {
    script: string,
    hash: string,
    index: number,
    value: number
  }

  export type Transaction = {
    ins: TransactionPoint[],
    outs: TransactionPoint[]
  }

  interface BCHJS {
    HDNode: HDNode,
    ECPair: ECPair,
    ECSignature: ECSignature
  }

  export default BCHJS
}