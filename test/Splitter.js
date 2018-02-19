var Splitter = artifacts.require("Splitter");
var Promise = require("bluebird");
Promise.promisifyAll(web3.eth, {suffix: "Promise"});
var expectedExceptionPromise = require("./expected_exception_testRPC_and_geth.js");

contract("Splitter", accounts => {

    describe("validate split transaction sent to the contract", () => {
        let instance;
        let transferredAmount = 100;
        let addressAlice = accounts[0];
        let addressBob = accounts[1];
        let addressCarol = accounts[2];
        let addressUnknown = accounts[3];

        beforeEach("deploy and prepare", () => {
            return Splitter.new({from: accounts[0]})
                .then(_instance => {
                    instance = _instance;
                });
        });

        it("should split even amount into equal shares", () => {
            return instance.performSplit(addressBob, addressCarol, {from: addressAlice, value: transferredAmount})
                .then(txObj => {
                    assert.strictEqual(parseInt(txObj.receipt.status), 1, 
                        "The transaction has been completed successfully");

                    assert.equal(txObj.logs[0].event, "LogNewSplit", 
                        "The event LogNewSplit was fired");                    
                    assert.equal(txObj.logs[0].args["value"].toString(10), 
                        transferredAmount.toString(10), 
                        "The event LogNewSplit recorded correctly the transferred value");

                    assert.equal(txObj.logs[1].event, "LogBalanceIncreasedWithSplitShare", 
                        "The event LogBalanceIncreasedWithSplitShare was fired");
                    assert.equal(txObj.logs[1].args["value"].toString(10), 
                        (transferredAmount/2).toString(10), 
                        "The event LogBalanceIncreasedWithSplitShare recorded correctly half of the splitted amount");

                    return instance.getFunds(addressBob);
                }).then(balance => {
                    assert.equal(balance.toString(10), (transferredAmount/2).toString(10), 
                        "Bob's balance holds the half of the transferred amount ");

                    return instance.getFunds(addressCarol);
                }).then(balance => {
                    assert.equal(balance.toString(10), (transferredAmount/2).toString(10), 
                        "Carol's balance holds the half of the transferred amount ");                    
                });

        });

        it("should split odd amount into equal shares and keep track of remainder separately", () => {
            let transferredAmountOdd = transferredAmount + 1;

            return instance.performSplit(addressBob, addressCarol, {from: addressAlice, value: transferredAmountOdd})
                .then(txObj => {

                    assert.strictEqual(parseInt(txObj.receipt.status), 1, 
                        "The transaction has been completed successfully");

                    assert.equal(txObj.logs[3].event, "LogBalanceIncreasedWithRemainder", 
                        "The event LogBalanceIncreasedWithRemainder was fired");
                    
                    assert.equal(txObj.logs[3].args["value"].toString(10), 
                        "1", 
                        "The event LogBalanceIncreasedWithRemainder recorded correctly the transferred value");

                    return instance.getFunds(addressBob);
                }).then(balance => {
                    assert.equal(balance.toString(10), 
                        Math.floor(transferredAmountOdd/2).toString(10), 
                        "Bob's balance holds the half of the transferred amount ");

                    return instance.getFunds(addressCarol);
                }).then(balance => {
                    assert.equal(balance.toString(10), 
                        Math.floor(transferredAmountOdd/2).toString(10), 
                        "Carol's balance holds the half of the transferred amount ");

                    return instance.getFunds(addressAlice);                    
                }).then(remainderValue => {
                    assert.equal(remainderValue.toString(10),
                        "1", 
                        "remainder of the split action is kept is contract's state variable")

                });
        });

        /*it("should revert if sender is not the registered benefactor", () => {
            return expectedExceptionPromise(() => {
                return instance.performSplit({from: addressUnknown, value: 100, 
                    gas: 1000000})}, 1000000);
        }); */  
    });

    
    describe("validate queries of contract's data", () => {
        let instance;
        let transferredAmount = 100;
        let splitShare = transferredAmount / 2;
        let addressAlice = accounts[0];
        let addressBob = accounts[1];
        let addressCarol = accounts[2];

        beforeEach("deploy and prepare", () => {
            return Splitter.new({from: accounts[0]})
                .then(_instance => {
                    instance = _instance;

                    return instance.performSplit(addressBob, addressCarol, {from: addressAlice, value: transferredAmount}); 
                });
        });

        it("should be able to get the beneficiaries balances", () => {
            return instance.getFunds(addressBob)
                .then(balance => {
                    assert.isAbove(balance.toNumber(), 0,
                        "The balance of 1st beneficiary should hold a positive amount");

                    return instance.getFunds(addressCarol);
                }).then(balance => {
                    assert.isAbove(balance.toNumber(), 0,
                        "The balance of 2nd beneficiary should hold a positive amount");         
                });
        });
    }); 
    

    describe("validate split withdrawal", () => {
        let instance;
        let transferredAmount = 100;
        let splitShare = transferredAmount / 2;
        let addressAlice = accounts[0];
        let addressBob = accounts[1];
        let addressCarol = accounts[2];
        let addressUnknown = accounts[3];

        beforeEach("deploy and prepare", () => {
            return Splitter.new({from: accounts[0]})
                .then(_instance => {
                    instance = _instance;

                    return instance.performSplit(addressBob, addressCarol, {from: addressAlice, value: transferredAmount}); 
                });
        });

        it("should be able to withdraw funds if sender is a registered beneficiary", () => {
            return instance.withdrawFunds({from: addressBob})
                .then(txObj => {
                    assert.strictEqual(parseInt(txObj.receipt.status), 1, 
                        "The withdraw transaction has been completed successfully");

                    assert.equal(txObj.logs[0].event,
                        "LogWithdrawal",
                        "Event LogWithdrawal was fired");

                    assert.equal(txObj.logs[0].args["value"],
                        (transferredAmount/2).toString(10),
                        "Event LogWithdrawal correctly registered the ");
                });

        });

        it("should not allow withdrawal if sender is not a registered beneficiary", () => {
            return expectedExceptionPromise(() => {
                return instance.withdrawFunds({from: addressUnknown, 
                    gas: 1000000})}, 
                1000000);
        }); 
    });

});