import { getDefinitions, verifySignature } from 'verify-xrpl-signature'

const main = async () => {
    const request = (url, body) => fetch(url, { method: body ? "POST" : "GET", body }).then(r => r.json())

    const someTx = '7321ED5F6B1BA1287DF7E720DB47F5FA648D2D64C0DBC46DAC988543DADC293FC66D6B74402EC75DE237CDAFC2FF9DA4A41529E5661ADC0A8BE0BDA4EB9B9893FB1AD492AAE24D5204FC26313E992FDDD7FAC9AB3D0108E9B62EB9AD7DE1145536AD18C0088114691682CBEF94221F45DE65F3F3CE6C61804324A0'

    console.log(verifySignature(someTx, undefined, await getDefinitions("XAHAU", request)))
}

main()