pragma solidity ^0.4.4;

// This is a splitter contract that facilitates the splitting 
// of an amount from one benefactor to 2 benefeiciaries. 
// the splitting ratio is 50-50

contract Splitter {

    enum Status {
        Running,
        Paused
    }

    event LogNewSplit(
        address indexed benefactor, 
        address indexed beneficiary1,
        address indexed beneficiary2,
        uint value);
    event LogBalanceIncreasedWithSplitShare(
        address indexed beneficiary, 
        uint value);
    event LogBalanceIncreasedWithRemainder(
        address indexed benefactor, 
        uint value);
    event LogWithdrawal(
        address indexed _beneficiary, 
        uint value);
    event LogStatusChanged(address indexed sender, Status newStatus);
    
    // contract's owner
    address owner;
    // keep track of all balances
    mapping(address => uint) balanceOf;
    // switch for having a 
    Status public currentStatus = Status.Running;

    function Splitter() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);

        _;
    }

    modifier onlyIfRunning() {
        require(currentStatus == Status.Running);

        _;
    }

    function performSplit(address beneficiary1, address beneficiary2)
        public
        onlyIfRunning
        payable
    {
        
        require(msg.sender != beneficiary1);
        require(msg.sender != beneficiary2);  

        LogNewSplit(msg.sender, beneficiary1, beneficiary2, msg.value);

        // split the amount
        uint splitShare = msg.value / 2;
        
        // increement the balances of each beneficiaries 
        // with the corresponding share or current split
        balanceOf[beneficiary1] += splitShare;
        LogBalanceIncreasedWithSplitShare(beneficiary1, splitShare);
        
        balanceOf[beneficiary2] += splitShare;
        LogBalanceIncreasedWithSplitShare(beneficiary2, splitShare);

        // if msg.value is odd, 
        // then keep the split remainder in the sender's balance
        uint remainder = msg.value - splitShare * 2;
        if (remainder > 0) {
            balanceOf[msg.sender] += remainder;
            LogBalanceIncreasedWithRemainder(msg.sender, remainder);
        }

        // TODO: verify the balance invariant remains valid

    } 

    function getFunds(address addr)
        public
        constant
        returns(uint balance)
    {
        return balanceOf[addr];
    }  

    function withdrawFunds()
        public
        onlyIfRunning
    {
        // only accept withdrawal accounts that have positive balances
        require(balanceOf[msg.sender] > 0);
        
        // implement the pattern Checks-Effects-Interactions
        uint valueToWithdraw = balanceOf[msg.sender];
        balanceOf[msg.sender] = 0;        
        msg.sender.transfer(valueToWithdraw);
        LogWithdrawal(msg.sender, valueToWithdraw);
    }

    function kill()
        public 
        onlyOwner
    {
        currentStatus = Status.Paused;
        LogStatusChanged(msg.sender, currentStatus);
    }

    function resume()
        public 
        onlyOwner
    {
        currentStatus = Status.Running;
        LogStatusChanged(msg.sender, currentStatus);
    }  
}
