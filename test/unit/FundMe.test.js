const { assert, expect } = require("chai")
const { deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.parseEther("1") // 1 ETH
          beforeEach(async function () {
              // Deploy fundMe contract using Hardhat-deploy
              // const accounts = await ethers.getSigner()
              // const accountsZero = accounts[0]
              deployer = await ethers.provider.getSigner()
              await deployments.fixture(["all"])
              fundMeDeploymentsAddress = (await deployments.get("FundMe"))
                  .address
              fundMe = await ethers.getContractAt(
                  "FundMe",
                  fundMeDeploymentsAddress,
                  deployer,
              )
              mockV3AggregatorDeploytmentsAddress = (
                  await deployments.get("MockV3Aggregator")
              ).address
              mockV3Aggregator = await ethers.getContractAt(
                  "MockV3Aggregator",
                  mockV3AggregatorDeploytmentsAddress,
                  deployer,
              )
          })

          describe("Contructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  mockAddress = await mockV3Aggregator.getAddress()
                  assert.equal(response, mockAddress)
              })
          })

          describe("fund", async function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough!",
                  )
              })
              it("Update the amount funded date structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer.address,
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Add funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunders(0)
                  assert.equal(funder, deployer.address)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("Withdraw ETH from a single founder", async function () {
                  // Arrage
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)

                  const staringDeployerBalance =
                      await ethers.provider.getBalance(deployer.address)
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBlance = await ethers.provider.getBalance(
                      fundMe.target,
                  )
                  const endingDeployerBlance = await ethers.provider.getBalance(
                      deployer.address,
                  )
                  // Assert
                  assert.equal(endingFundMeBlance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + staringDeployerBalance
                      ).toString(),
                      (endingDeployerBlance + gasCost).toString(),
                  )
              })
              it("Allow us to withdraw with multiple funnders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)

                  const staringDeployerBalance =
                      await ethers.provider.getBalance(deployer.address)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer.address)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + staringDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString(),
                  )

                  // Make sure the funders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract =
                      await fundMe.connect(attacker)
                  await expect(
                      attackerConnectedContract.withdraw(),
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("cheaperWithdraw testing...", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)

                  const staringDeployerBalance =
                      await ethers.provider.getBalance(deployer.address)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer.address)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + staringDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString(),
                  )

                  // Make sure the funders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })
          })
      })
