pragma solidity ^0.4.4;

// This is a splitter contract that facilitates the splitting 
// of an amount from one benefactor to 2 benefeiciaries. 
// the splitting ratio is 50-50

contract Splitter {
    struct Beneficiary 
    {
        address addr;
        uint balance;
    }

    enum BeneficiaryID 
    {
        Bob,
        Carol
    }

    event LogNewAmountSplitted(uint value);
    event LogRemainderSplitted(uint8 value);
    event LogBeneficiaryWithdrawalSuccessfully(address indexed _beneficiary, uint amount);
    event LogBeneficiaryWithdrawalFailed(address indexed _beneficiary, uint amount);


    address public benefactorAlice;
    mapping(uint8 => Beneficiary) public beneficiaries;
    uint8 remainder; // keep the remainder of a split of an odd amount

    function Splitter(address _benefactor, 
                        address _beneficiary1, 
                        address _beneficiary2)
    {
        require(_benefactor != _beneficiary1);
        require(_benefactor != _beneficiary2);    

        benefactorAlice = _benefactor;

        beneficiaries[uint8(BeneficiaryID.Bob)] = Beneficiary(_beneficiary1, 0);
        beneficiaries[uint8(BeneficiaryID.Carol)] = Beneficiary(_beneficiary2, 0);
    }

    function performSplit()
        public
        payable
        returns(bool success)
    {
        
        // only accept splut request from benefactor
        require(msg.sender == benefactorAlice);

        // if the amount transferred is not even, 
        // then keep the remaining in the contract's remainder variable
        uint splitAmount = msg.value / 2;
        remainder += uint8(msg.value % 2);

        // get the remainder split
        uint8 splitRemainder = remainder / 2;
        remainder = remainder % 2;

        // charge the balances of each beneficiaries with the corresponding amount
        beneficiaries[uint8(BeneficiaryID.Bob)].balance += splitAmount + splitRemainder;
        beneficiaries[uint8(BeneficiaryID.Carol)].balance += splitAmount + splitRemainder;

        LogNewAmountSplitted(msg.value);
        if (splitRemainder > 0) LogRemainderSplitted(splitRemainder * 2);

        return(true);
    } 

    function getAccountBalance()
        public
        constant
        returns(uint balance)
    {
        if (msg.sender == beneficiaries[uint8(BeneficiaryID.Bob)].addr) {
            return beneficiaries[uint8(BeneficiaryID.Bob)].balance;
        } else if (msg.sender == beneficiaries[uint8(BeneficiaryID.Carol)].addr) {
            return beneficiaries[uint8(BeneficiaryID.Carol)].balance;
        } else {
            return 0;
        }
    }

    function withdrawFunds()
        public
        returns(bool success)
    {
        // only accept withdrawal from Bob or Carol
        require(msg.sender == beneficiaries[uint8(BeneficiaryID.Bob)].addr ||
            msg.sender == beneficiaries[uint8(BeneficiaryID.Carol)].addr);
        
        BeneficiaryID senderId;  
        if (msg.sender == beneficiaries[uint8(BeneficiaryID.Bob)].addr) {
            senderId = BeneficiaryID.Bob;
        } else if (msg.sender == beneficiaries[uint8(BeneficiaryID.Carol)].addr) {
            senderId = BeneficiaryID.Carol;
        } 

        // implement the pattern Checks-Effects-Interactions
        uint valueToWithdraw = beneficiaries[uint8(senderId)].balance;
        beneficiaries[uint8(senderId)].balance = 0;        
        if (msg.sender.send(valueToWithdraw)) {
            LogBeneficiaryWithdrawalSuccessfully(msg.sender, valueToWithdraw);
            return true;
        } else {
            LogBeneficiaryWithdrawalFailed(msg.sender, valueToWithdraw);
            return false;
        }

    }         
}