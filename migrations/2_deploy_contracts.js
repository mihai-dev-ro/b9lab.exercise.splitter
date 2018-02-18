var Splitter = artifacts.require("Splitter");
var SplitterCreator = artifacts.require("SplitterCreator");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Splitter, accounts[0], accounts[1], accounts[2]);
  deployer.deploy(SplitterCreator);
};
