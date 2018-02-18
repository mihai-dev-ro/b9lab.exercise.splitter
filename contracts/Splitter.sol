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

    event LogNewSplit(address indexed benefactor, uint value);
    event LogBeneficiaryBalanceUpdated(address indexed beneficiary, uint value);
    event LogRemainderUpdated(uint value);
    event LogBeneficiaryWithdrawal(address indexed _beneficiary, uint value);
    

    address public benefactor;
    mapping(uint8 => Beneficiary) public beneficiaries;
    uint remainder; // keep track of remainders from spliting odd amounts

    function Splitter(address _benefactor, 
        address _beneficiary1, 
        address _beneficiary2)
    {
        require(_benefactor != _beneficiary1);
        require(_benefactor != _beneficiary2);    

        benefactor = _benefactor;

        beneficiaries[uint8(BeneficiaryID.Bob)] = Beneficiary(_beneficiary1, 0);
        beneficiaries[uint8(BeneficiaryID.Carol)] = Beneficiary(_beneficiary2, 0);
    }

    modifier onlyOwner() {
        require(msg.sender == benefactor);

        _;
    }


    function performSplit()
        public
        onlyOwner
        payable
    {
        
        LogNewSplit(msg.sender, msg.value);

        // split the amount
        uint bobShare = msg.value / 2;
        uint carolShare = msg.value / 2;

        // charge the balances of each beneficiaries 
        // with the corresponding share or current split
        beneficiaries[uint8(BeneficiaryID.Bob)].balance += bobShare;
        LogBeneficiaryBalanceUpdated(beneficiaries[uint8(BeneficiaryID.Bob)].addr, 
            beneficiaries[uint8(BeneficiaryID.Bob)].balance);
        
        beneficiaries[uint8(BeneficiaryID.Carol)].balance += carolShare;    
        LogBeneficiaryBalanceUpdated(beneficiaries[uint8(BeneficiaryID.Carol)].addr, 
            beneficiaries[uint8(BeneficiaryID.Carol)].balance);
        
        // if msg.value is odd, then keep track of the split remainder
        // and add it to the contract's state variable
        if (msg.value % 2 == 1) {
            remainder += msg.value - bobShare - carolShare;
            LogRemainderUpdated(remainder);
        }

        // verify the balance invariant remains valid
        assert(this.balance == beneficiaries[uint8(BeneficiaryID.Bob)].balance + 
            beneficiaries[uint8(BeneficiaryID.Carol)].balance +
            remainder);
    } 


    function withdrawFunds()
        public
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
        msg.sender.transfer(valueToWithdraw);
        LogBeneficiaryWithdrawal(msg.sender, valueToWithdraw);
    }

    function getFunds(address beneficiaryAddress)
        public
        constant
        returns(uint balance)
    {
        if (beneficiaryAddress == beneficiaries[uint8(BeneficiaryID.Bob)].addr) {
            return beneficiaries[uint8(BeneficiaryID.Bob)].balance;
        } else if (beneficiaryAddress == beneficiaries[uint8(BeneficiaryID.Carol)].addr) {
            return beneficiaries[uint8(BeneficiaryID.Carol)].balance;
        } else {
            return 0;
        }
    }  

    function getRemainder()
        public
        constant
        returns(uint)
    {
        return remainder;
    }

    function getBeneficiaryAddress(uint8 beneficiaryId)
        public
        constant
        returns (address addr)
    {
        if (beneficiaryId == uint8(BeneficiaryID.Bob)) {
            return beneficiaries[uint8(BeneficiaryID.Bob)].addr;
        } else if (beneficiaryId == uint8(BeneficiaryID.Carol)) {
            return beneficiaries[uint8(BeneficiaryID.Carol)].addr;
        } else {
            return 0;
        }
    }     

    function kill()
        public 
        onlyOwner
    {
        selfdestruct(msg.sender);
    }  
}

contract SplitterCreator {

    event LogNewSplitterCreated(Splitter indexed splitterAddress);

    function createSplitter(
        address benefactor, 
        address beneficiary1,
        address beneficiary2
    )
        public
        returns(Splitter splitterAddress)
    {
        splitterAddress = new Splitter(benefactor, beneficiary1, beneficiary2);
        LogNewSplitterCreated(splitterAddress);
        return;
    }
} 