export const content =
`{
	"fuzzing": {
	   "workers": 10,
	   "workerResetLimit": 50,
	   "timeout": 0,
	   "testLimit": 5000000,
	   "callSequenceLength": 100,
	   "corpusDirectory": "corpus_medusa",
	   "coverageEnabled": true,
	   "deploymentOrder": [
		  "FuzzTester"
	   ],
	   "targetContracts": [
		  "FuzzTester"
	   ],
	   "targetContractsBalances": [
		  "0xffffffffffffffffffffffffffffffffffffffffffffffff"
	   ],
	   "constructorArgs": {},
	   "deployerAddress": "0x30000",
	   "senderAddresses": [
		  "0x10000",
		  "0x20000",
		  "0x30000"
	   ],
	   "blockNumberDelayMax": 60480,
	   "blockTimestampDelayMax": 604800,
	   "blockGasLimit": 125000000,
	   "transactionGasLimit": 12500000,
	   "testing": {
		  "stopOnFailedTest": false,
		  "stopOnFailedContractMatching": false,
		  "stopOnNoTests": true,
		  "testAllContracts": false,
		  "traceAll": false,
		  "assertionTesting": {
			 "enabled": true,
			 "testViewMethods": true,
			 "panicCodeConfig": {
				"failOnCompilerInsertedPanic": false,
				"failOnAssertion": true,
				"failOnArithmeticUnderflow": false,
				"failOnDivideByZero": false,
				"failOnEnumTypeConversionOutOfBounds": false,
				"failOnIncorrectStorageAccess": false,
				"failOnPopEmptyArray": false,
				"failOnOutOfBoundsArrayAccess": false,
				"failOnAllocateTooMuchMemory": false,
				"failOnCallUninitializedVariable": false
			 }
		  },
		  "propertyTesting": {
			 "enabled": true,
			 "testPrefixes": [
				"property_"
			 ]
		  },
		  "optimizationTesting": {
			 "enabled": false,
			 "testPrefixes": [
				"optimize_"
			 ]
		  }
	   },
	   "chainConfig": {
		  "codeSizeCheckDisabled": true,
		  "cheatCodes": {
			 "cheatCodesEnabled": true,
			 "enableFFI": false
		  }
	   }
	},
	"compilation": {
	   "platform": "crytic-compile",
	   "platformConfig": {
		  "target": ".",
		  "solcVersion": "",
		  "exportDirectory": "",
		  "args": [
			 "--foundry-compile-all"
		  ]
	   }
	},
	"logging": {
	   "level": "info",
	   "logDirectory": "",
	   "noColor": false
	}
 }`;