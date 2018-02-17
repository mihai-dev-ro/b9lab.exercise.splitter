// get the splitter instance
var smartContractBalanceField = $("#smartContractBalance");
var aliceBalanceField = $("#aliceBalance");
var bobBalanceField = $("#bobBalance");
var carolBalanceField = $("#carolBalance");
var aliceNewSplitRequstField = $("#aliceNewSplitRequest");

var instance;
var aliceAddress;
var bobAddress;
var carolAddress; 

function showNotification(text) {
    $("#pageNotifications").html(text).show();
}

function updateNotification(text) {
    $("#pageNotifications").html(text);
}

function closeNotification() {
    $("#pageNotifications").hide();
}

function showProcessingStateOnSubmitButton() {
    $("#submitNewSplitRequest")
        .removeClass("btn-outline-primary")
        .addClass("btn-outline-light")
        .text("processing...");
}

function removeProcessingStateOnSubmitButton() {
    $("#submitNewSplitRequest")
        .removeClass("btn-outline-light")
        .addClass("btn-outline-primary")
        .text("Submit");
}

function resetFields() {
    aliceNewSplitRequstField.val("");
}

function getBalancePromise(addr) {
    return new Promise(function(resolve, reject) {
        web3.eth.getBalance(addr, function(err, balance) {
            if (err) reject(err);
            else resolve(balance);
        })
    });
}

function populateGUI() {
    showNotification("process in progress. populating fields with data from ethereum node")

    return Splitter.deployed().then(_instance => {
         instance = _instance;

         return instance.benefactor();
    }).then(benefactorAddr => {
        aliceAddress = benefactorAddr;

        return instance.getBeneficiaryAddress(0);
    }).then(beneficiaryAddr => {
        bobAddress = beneficiaryAddr;

        return instance.getBeneficiaryAddress(1);
    }).then(beneficiaryAddr => {
        carolAddress = beneficiaryAddr;

        return getBalancePromise(instance.address);
    }).then(contractBalance => {
        smartContractBalanceField.val(web3.fromWei(contractBalance, "ether").toString(10));

        return getBalancePromise(aliceAddress);
    }).then(aliceBalance => {
        aliceBalanceField.val(web3.fromWei(aliceBalance, "ether").toString(10));

        return instance.getFunds(bobAddress);
    }).then(bobBalance => {
        bobBalanceField.val(web3.fromWei(bobBalance, "ether").toString(10));

        return instance.getFunds(carolAddress);
    }).then(carolBalance => {
        carolBalanceField.val(web3.fromWei(carolBalance, "ether").toString(10));

        return;
    }).then(() => {
        closeNotification();
        removeProcessingStateOnSubmitButton();
        resetFields();
    });
}

function requestNewSplit() {
    let instance;
    let amountToSplit = parseFloat(aliceNewSplitRequstField.val());
    if (!amountToSplit) return;

    showNotification("split transaction is being executed. patience please... ");
    showProcessingStateOnSubmitButton();

    return Splitter.deployed().then(_instance => {
        instance = _instance;

        return instance.performSplit({
            from: aliceAddress,
            value: web3.toWei(amountToSplit, "ether")
        });
    }).then(txObj => {
        if(parseInt(txObj.receipt.status) !== 1) {
            throw "error when trying to send split transaction;";
        } 

        return populateGUI();
    }).catch(function(err) {
        updateNotification(err);
        removeProcessingStateOnSubmitButton();
    });
} 

$(function() {
    closeNotification();

    populateGUI();

    $("#submitNewSplitRequest").on("click", function(e) {
        requestNewSplit();
    });
});
