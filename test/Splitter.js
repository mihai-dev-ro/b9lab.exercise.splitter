var Splitter = artifacts.require("./Splitter.sol");
var Promise = require("bluebird");
Promise.promisifyAll(web3.eth, {suffix: "Promise"});

contract("Splitter", accounts => {
	let instance;
	let amountEvenToSplit = 100;
	let aliceAddress, bobAddress, carolAddress;
	let balanceOfBobBeforeSplit = 0, balanceOfCarolBeforeSplit = 0;

	describe("validate transaction sent to the contract", () => {
		it("should accept split requests only from the Benefactor(Alice)", () => {
			
			return Splitter.deployed()
				.then(_instance => {
					instance = _instance;
					return _instance.benefactorAlice.call();
				}).then(benefactor => {
					let i = 0;
					while(accounts[i] == benefactor) {
						i++;
					}
					return instance.sendTransaction({from: accounts[i], value: amountEvenToSplit})
				}).catch(error => {
					assert.include(error.message, "revert", "Splitter should accept transactuions only from Alice");
				}); 
		});	
	});

	describe("validate split accuracy and finalization", () => {
		beforeEach("get all stakeholders' addresses & beneficiaries' balances", () => {
			return Splitter.deployed().then(_instance => {
					instance = _instance;

					return instance.beneficiaryBob.call();
				}).then(address => {
					bobAddress = address;
					return web3.eth.getBalancePromise(address);
				}).then(balance => {
					balanceOfBobBeforeSplit = balance;
					
					return instance.beneficiaryCarol.call();
				}).then(address => {
					carolAddress = address;
					return web3.eth.getBalancePromise(address);
				}).then(balance=> {
					balanceOfCarolBeforeSplit = balance;

					return instance.benefactorAlice.call();
				}).then(benefactor => {
					aliceAddress = benefactor;
				}); 
		});

		it("should split an even number 100Wei from Alice to Bob and Carol", () => {
			return Promise.resolve().then(() => {
					return instance.sendTransaction({from: aliceAddress, value: amountEvenToSplit});
				}).then(txObj => {
					assert.equal(txObj.receipt.status, 1, "Alice has successfully send transaction to contract");
					
					return web3.eth.getBalancePromise(bobAddress);
				}).then(balanceOfBobAfterSplit => {		
					assert.equal(balanceOfBobAfterSplit.minus(balanceOfBobBeforeSplit).toNumber(), amountEvenToSplit/2, "Bob has an extra amount of 50Wei in his account" );

					return web3.eth.getBalancePromise(carolAddress);
				}).then(balanceOfCarolAfterSplit => {
					assert.equal(balanceOfCarolAfterSplit.minus(balanceOfCarolBeforeSplit).toNumber(), amountEvenToSplit/2, "Carol has an extra amount of 50Wei in his account" );
				});
		});

		it("the should keep the remainder of an odd split amount", () => {
			return Promise.resolve().then(() => {
					return instance.sendTransaction({from: aliceAddress, value: amountEvenToSplit + 1});
				}).then(txObj => {
					assert.equal(txObj.receipt.status, 1, "Alice has successfully send transaction to contract");
					
					return instance.getBalance.call();
				}).then(contractBalance => {		
					assert.isAbove(contractBalance.toNumber(), 0, "Splitting into half an odd number result in a reminder that stays within the contract" );
				});
		})
	});	
});





// contract('Splitter', function(accounts) {
// 	it("it should split 100 Wi in", function() {
// 		return Splitter.deployed().then(function(instance) {
// 			return instance.getBalance.call();
// 		}).then(function(balance) {
// 			assert.equal(balance.valueOf(), )
// 		});
// 	});

// });

