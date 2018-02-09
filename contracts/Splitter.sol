pragma solidity ^0.4.4;

// This is a splitter contract that facilitates the splitting 
// of an amount from one benefactor to 2 benefeiciaries. 
// the splitting ratio is 50-50

contract Splitter {
	struct Beneficiary 
	{
		address toAddress;
	}


	address public benefactorAlice;
	Beneficiary public beneficiaryBob;
	Beneficiary public beneficiaryCarol;
	uint public totalAmountProcessed;

	event LogSplitSent(address indexed _benefactor, 
						address indexed _beneficiary,
						uint amount);
	event LogSplitInitiated(address from, address benefactor);

	function Splitter(address _benefactor, 
						address _beneficiary1, 
						address _beneficiary2)
	{
		setSplitterStakeholders(_benefactor, _beneficiary1, _beneficiary2);
	}

	function getBalance()
		public
		constant
		returns(uint balance) 
	{
		return this.balance;
	}

	function setSplitterStakeholders(address _benefactor, 
									address _beneficiary1, 
									address _beneficiary2)
		public 
	{
		require(_benefactor != _beneficiary1);
		require(_benefactor != _beneficiary2);
	
		benefactorAlice = _benefactor;
		beneficiaryBob = Beneficiary(_beneficiary1);
		beneficiaryCarol = Beneficiary(_beneficiary2);
	}

	function performSplit()
		private
		returns(bool success)
	{
		totalAmountProcessed += msg.value; // keep track of all amount splitted		
		
		// if the amount transferred is not even, 
		// then keep the remaining in the contract's account
		uint splitAmount = msg.value / 2;
		Beneficiary[] memory beneficiaries = new Beneficiary[](2);
		beneficiaries[0] = beneficiaryBob;
		beneficiaries[1] = beneficiaryCarol;

		for(uint8 i = 0; i < 2; i ++) {
			if (!beneficiaries[i].toAddress.send(splitAmount)) revert();
			LogSplitSent(msg.sender, beneficiaries[i].toAddress, splitAmount);		
		}

		return(true);
	}  

	function () 
		public
		payable 
	{
		require(msg.sender == benefactorAlice);
		LogSplitInitiated(msg.sender, benefactorAlice);

		if (!performSplit()) revert();
	}
}