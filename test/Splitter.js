var Splitter = artifacts.require("Splitter");
var Promise = require("bluebird");
Promise.promisifyAll(web3.eth, {suffix: "Promise"});
var expectedExceptionPromise = require("./expected_exception_testRPC_and_geth.js");

contract("Splitter", accounts => {

    describe("validate split transaction sent to the contract", () => {
        it("should accept split requests only from the Benefactor(Alice)", () => {
            let instance;

            return Splitter.new(accounts[0], accounts[1], accounts[2], 
                    {from: accounts[0]})
                .then(_instance => {
                    instance = _instance;

                    return instance.performSplit({from: accounts[0], value: 100}); 
                }).then(txObj => {
                    assert.strictEqual(parseInt(txObj.receipt.status), 1, "The transaction has been completed successfully from benefactor(Alice)");

                    return expectedExceptionPromise(() => {
                        return instance.performSplit({from: accounts[3], value: 100, 
                            gas: 1000000})}, 1000000);
                }); 
        }); 

        it("should split the amount from Benefactor(Alice) into each beneficiary account", () => {
            let instance;
            let amountToSplit = 100;
            let addressAlice = accounts[0];
            let addressBob = accounts[1];
            let addressCarol = accounts[2];

            return Splitter.new(addressAlice, addressBob, addressCarol, 
                    {from: accounts[0]})
                .then(_instance => {
                    instance = _instance;

                    return instance.performSplit(
                            {from: addressAlice, value: amountToSplit});
                }).then(txObj => {
                    assert.strictEqual(parseInt(txObj.receipt.status), 1, "The transaction has been completed successfully");

                    return instance.getAccountBalance.call({from: addressBob});
                }).then(balance => {
                    assert.equal(balance.toString(10), (amountToSplit/2).toString(10), 
                        "Bob's balance holds the half of the split amount ");

                    return instance.getAccountBalance.call({from: addressCarol});
                }).then(balance => {
                    assert.equal(balance.toString(10), (amountToSplit/2).toString(10), 
                        "Carol's balance holds the half of the split amount ");                    
                });

        });
    });

    describe("validate split accuracy and withdrawal", () => {
        it("should split an even number 100Wei from Alice and Bob can withdraw his share", () => {
            let instance;
            let amountToSplit = 100;
            let addressAlice = accounts[0];
            let addressBob = accounts[1];
            let addressCarol = accounts[2];
            let balanceOfBobBeforeSplit = 0; 
            
            return Splitter.new(addressAlice, addressBob, addressCarol, 
                    {from: accounts[0]})
                .then(_instance => {
                    instance = _instance;

                    return instance.performSplit(
                        {from: addressAlice, value: amountToSplit});
                }).then(() => {
                    return web3.eth.getBalancePromise(addressBob);
                }).then(balance => {
                    balanceOfBobBeforeSplit = balance;

                    return instance.withdrawFunds({from: addressBob});
                }).then(txObj => {
                    assert.strictEqual(parseInt(txObj.receipt.status), 1, "Bob has succesffully withdrawn the splitted amount");

                    return web3.eth.getBalancePromise(addressBob);
                }).then(balance => {
                    assert(balance.minus(balanceOfBobBeforeSplit).toString(10),
                        (amountToSplit / 2).toString(10),
                        "Split funds have been succesffully transferred to Bob")

                });
        });

        it("should split an even number 100Wei from Alice and Carol can withdraw her share", () => {
            let instance;
            let amountToSplit = 100;
            let addressAlice = accounts[0];
            let addressBob = accounts[1];
            let addressCarol = accounts[2];
            let balanceOfCarolBeforeSplit = 0;

            return Splitter.new(addressAlice, addressBob, addressCarol, 
                    {from: accounts[0]})
                .then(_instance => {
                    instance = _instance;

                    return instance.performSplit(
                        {from: addressAlice, value: amountToSplit});
                }).then(() => {
                    return web3.eth.getBalancePromise(addressCarol);
                }).then(balance => {
                    balanceOfCarolBeforeSplit = balance;

                    return instance.withdrawFunds({from: addressCarol});
                }).then(txObj => {
                    assert.strictEqual(parseInt(txObj.receipt.status), 1, "Carol has succesffully withdrawn the splitted amount");

                    return web3.eth.getBalancePromise(addressCarol);
                }).then(balance => {
                    assert(balance.minus(balanceOfCarolBeforeSplit).toString(10),
                        (amountToSplit / 2).toString(10),
                        "Split funds have been succesffully transferred to Carol")

                });
        });


        it("the should keep track of odd amounts' split remainders and process them as well", () => {
            
            let instance;
            let firstAmountOddToSplit = new web3.BigNumber(101);
            let secondAmountOddToSplit = new web3.BigNumber(107);

            let addressAlice = accounts[0];
            let addressBob = accounts[1];
            let addressCarol = accounts[2];
            let balanceOfBobBeforeSplit = 0; 

            
            return Splitter.new(addressAlice, addressBob, addressCarol,
                    {from: accounts[0]})
                .then(_instance => {
                    instance = _instance;

                    return instance.performSplit(
                        {from: addressAlice, value: firstAmountOddToSplit}); 
                }).then((txObj) => {
                    assert.strictEqual(parseInt(txObj.receipt.status), 1, "Alice has successfully splitted " +
                        firstAmountOddToSplit.toString(10) + "Wei");

                    return instance.getAccountBalance({from: addressBob});
                }).then(balance => {
                    assert.equal(balance.toString(10), 
                        Math.floor(firstAmountOddToSplit / 2).toString(10),
                        "Bog's balance is equal to " + 
                        Math.floor(firstAmountOddToSplit / 2).toString(10));

                    return instance.performSplit(
                        {from: addressAlice, value: secondAmountOddToSplit}); 
                }).then((txObj) => {
                    assert.strictEqual(parseInt(txObj.receipt.status), 1, "Alice has successfully splitted " +
                        secondAmountOddToSplit.toString(10) + "Wei");

                    return instance.getAccountBalance({from: addressBob});
                }).then(balance => {
                    assert.equal(balance.toString(10),
                        firstAmountOddToSplit.plus(secondAmountOddToSplit).dividedBy(2).toString(10),
                        "Bob's balance is equal to (" +
                        firstAmountOddToSplit.toString(10) + " + " + 
                        secondAmountOddToSplit.toString(10) + ")/2");
                });

        })
    }); 
});