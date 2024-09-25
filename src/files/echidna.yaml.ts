export const content =
`testMode: "assertion"
prefix: "property_"
seqLen: 100
testLimit: 50000
balanceContract: 0xffffffffffffffffffffffffffffffffffffffffffffffff
coverage: true
corpusDir: "corpus_echidna"
cryticArgs: ["--foundry-compile-all"]
# output format (comment out for TUI)
format: "text"
# Hide solc stderr output and additional information during the testing.
quiet: false
stopOnFail: false

# https://github.com/crytic/echidna/wiki/Config#parameters-in-the-configuration-file`;
