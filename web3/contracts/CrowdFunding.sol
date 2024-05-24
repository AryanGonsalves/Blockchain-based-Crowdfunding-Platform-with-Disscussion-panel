// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CrowdFunding is Ownable {
    using SafeMath for uint256;

    /// Structure of each campaign
    struct Campaign {
        address owner;
        bool payedOut;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        string image;
        address[] donators;
        uint256[] donations;
    }

    //  mappping to hold each campaign's data
    mapping(uint256 => Campaign) public campaigns;

    // defining tax of the platform( null for ours)
    uint8 public platformTax;
    // holding number of all campaigns 
    uint24 public numberOfCampaigns;

    // activity status of the contract
    bool public emergencyMode; // default: false

    // when a main functionality executed
    // (such as: creating/deleting/updating capaigns, and etc.)
    event Action (
        uint256 id,
        string actionType,
        address indexed executor,
        uint256 timestamp
    );

    // in case of changing activity status of the contract
    event ContractStateChanged (
        bool State
    );

    error LowEtherAmount(uint minAmount, uint payedAmount);

    error DeadLine(uint campaingDeadline, uint requestTime);

    // to Prevent unauthorized entity from executing specific function
    modifier privilageEntity(uint _id) {
        _privilagedEntity(_id);
        _;
    }

    // Incase contract fails
    modifier notInEmergency() {
        require(!emergencyMode);
        _;
    }

    // Incase contract fails
    modifier onlyInEmergency() {
        require(emergencyMode);
        _;
    }

    // Preventing entering null values as campaign details
    modifier notNull(
        string memory title,
        string memory description,
        uint256 target,
        uint256 deadline,
        string memory image) {
            _nullChecker(title, description, target, deadline, image);
            _;
        }

    /// @param _platformTax -> tax of the platform
    constructor(uint8 _platformTax) {
        platformTax = _platformTax;
    }

    function createCampaign(
        address _owner, 
        string memory _title, 
        string memory _description,
        uint256 _target, 
        uint256 _deadline, 
        string memory _image
        ) external notNull(_title, _description, _target, _deadline, _image) notInEmergency returns (uint256) {
            require(block.timestamp <  _deadline, "Deadline must be in the future");
            Campaign storage campaign = campaigns[numberOfCampaigns];
            numberOfCampaigns++;

            campaign.owner = _owner;
            campaign.title = _title;
            campaign.description = _description;
            campaign.target = _target;
            campaign.deadline = _deadline;
            campaign.amountCollected = 0;
            campaign.image = _image;
            campaign.payedOut = false;

            emit Action (
                numberOfCampaigns,
                "Campaign Created",
                msg.sender,
                block.timestamp
            );

            return numberOfCampaigns - 1;
    }

    function updateCampaign(
        uint256 _id,
        string memory _title, 
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
         ) external privilageEntity(_id) notNull(_title, _description, _target, _deadline, _image) notInEmergency returns (bool) {
            require(block.timestamp <  _deadline, "Deadline must be in the future");
            
            // Making a pointer for a campaign
            Campaign storage campaign = campaigns[_id];
            require(campaign.owner > address(0), "No campaign exist with this ID");
            require(campaign.amountCollected == 0, "Update error: amount collected");

            campaign.title = _title;
            campaign.description = _description;
            campaign.target = _target;
            campaign.deadline = _deadline;
            campaign.amountCollected = 0;
            campaign.image = _image;
            campaign.payedOut = false;

            emit Action (
                _id,
                "Campaign Updated",
                msg.sender,
                block.timestamp
            );
            return true;
    }

    function donateToCampaign(uint256 _id) external payable notInEmergency {
        if(msg.value == 0 wei) revert LowEtherAmount({minAmount: 1 wei, payedAmount: msg.value});
        Campaign storage campaign = campaigns[_id];
        if(campaigns[_id].payedOut == true) revert("Funds withdrawed before");
        require(campaign.owner > address(0), "No campaign exist with this ID");
        if(campaign.deadline < block.timestamp) {
            revert DeadLine(
                {
                    campaingDeadline:campaigns[_id].deadline,
                    requestTime: block.timestamp
                }
            );
        }
        uint256 amount = msg.value;
        if(campaign.amountCollected > campaign.amountCollected.add(amount)) revert ("Target amount has reached");
        campaign.amountCollected = campaign.amountCollected.add(amount);

        campaign.donators.push(msg.sender);
        campaign.donations.push(amount);

        emit Action (
            _id,
            "Donation To The Campaign",
            msg.sender,
            block.timestamp
        );
    }

    function payOutToCampaignTeam(uint256 _id) external privilageEntity(_id) notInEmergency returns (bool) {
        // this line will avoid re-entrancy attack
        if(campaigns[_id].payedOut == true) revert("Funds withdrawed before");
        if(msg.sender != address(owner())) {
            if(campaigns[_id].deadline > block.timestamp) {
                revert DeadLine(
                    {
                        campaingDeadline:campaigns[_id].deadline,
                        requestTime: block.timestamp
                    }
                );
            }
        }

        campaigns[_id].payedOut = true;
        (uint256 raisedAmount, uint256 taxAmount) = _calculateTax(_id);
        _payTo(campaigns[_id].owner, (raisedAmount - taxAmount));
        _payPlatformFee(taxAmount);
        emit Action (
            _id,
            "Funds Withdrawal",
            msg.sender,
            block.timestamp
        );
        return true;
    }

    function _payPlatformFee(uint256 _taxAmount) internal {
        _payTo(owner(), _taxAmount);
    }

    // Deleting a specific fundraising campaign 
    /// @param _id -> campaign id
    /// @return true, if deleting works
    function deleteCampaign(uint256 _id) external privilageEntity(_id) notInEmergency returns (bool) {
        // check if a capmpaign with specific id exists.
        require(campaigns[_id].owner > address(0), "No campaign exist with this ID");
        if(campaigns[_id].amountCollected > 0 wei) {
            _refundDonators(_id);
        }
        delete campaigns[_id];

        emit Action (
            _id,
            "Campaign Deleted",
            msg.sender,
            block.timestamp
        );

        numberOfCampaigns -= 1;
        return true;
    }


    function getDonators(uint256 _id) external view returns (address[] memory, uint256[] memory) {
        return (campaigns[_id].donators, campaigns[_id].donations);
    }

    // to Update platform tax
    /// @param _platformTax -> new platform tax
    function changeTax(uint8 _platformTax) external onlyOwner {
        platformTax = _platformTax;
    }

    // to halt fundraising of a specific campaign 
    /// @param _id -> campaign id
    function haltCampaign(uint256 _id) external onlyOwner {
        campaigns[_id].deadline = block.timestamp;

        emit Action (
            _id,
            "Campaign halted",
            msg.sender,
            block.timestamp
        );
    }

    function getCampaigns() external view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);

        for(uint i=0; i < numberOfCampaigns; i++) {
            Campaign storage item = campaigns[i];

            allCampaigns[i] = item;
        }
        return allCampaigns;
    }



    function changeContractState() external onlyOwner {
        emergencyMode = !emergencyMode;
        
        emit ContractStateChanged(emergencyMode);
    }

    function withdrawFunds(uint256 _startId, uint256 _endId) external onlyOwner onlyInEmergency {
        for(uint i = _startId; i <= _endId; i++) {
            _refundDonators(_startId, _endId);
        }
    }

    // Making refund to donators of a specific campaign
    /// @param _id -> campgin id
    function _refundDonators(uint _id) internal {
        uint256 donationAmount;
        Campaign storage campaign = campaigns[_id];
        for(uint i; i < campaign.donators.length; i++) {
            donationAmount = campaign.donations[i];
            campaign.donations[i] = 0;
            _payTo(campaign.donators[i], donationAmount);
            // campaign.donations[i] = 0;
        }
        campaign.amountCollected = 0;
    }


    function _refundDonators(uint256 _idFrom, uint256 _idTo) internal {
        require(_idFrom < _idTo, "Invalid id range");
        require(campaigns[_idTo].owner > address(0), "No campaign exist with this ID");
        uint256 donationAmount;
        for(uint i = _idFrom; i < _idTo; i++) {
        Campaign storage campaign = campaigns[i]; 
        uint256 campaignDonators = campaign.donators.length;
            if(campaignDonators > 0) {
                for(uint j = 0; j < campaignDonators; j++) {
                    donationAmount = campaign.donations[j];
                    campaign.donations[j] = 0;
                    _payTo(campaign.donators[j], donationAmount);
                    // campaign.donations[j] = 0;
                }
                    campaign.amountCollected = 0;
            }
        }
    }

    // Calculating the tax amount (not used in this project)
    /// @param _id -> campaign id
    /// @return total -> funded amount of specific campaign
    /// @return tax -> tax of funded amount of specific campaign (not used for our project)
    function _calculateTax(uint256 _id) internal view returns (uint, uint) {
        uint raised = campaigns[_id].amountCollected;
        uint tax = (raised * platformTax) / 100;
        return (raised, tax);
    }

    // Paying creator of the campaign
    /// @param to -> reciever of the raised amount
    /// @param amount -> raised amount
    function _payTo(address to, uint256 amount) internal returns (bool) {
        (bool success, ) = payable(to).call{value: amount}("");
        require(success);
        return true;
    }
    
  
    function _nullChecker(
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
        ) internal pure {
            require((
                    bytes(_title).length > 0 
                    && bytes(_description).length > 0 
                    && _target > 0 
                    && _deadline > 0 
                    && bytes(_image).length > 0
                ), "Null value not acceptable");
    }

    // To prevent unauthorized execution of specific function
    /// @param _id -> campaign id
    function _privilagedEntity(uint256 _id) internal view {
        require(
            msg.sender == campaigns[_id].owner ||
            msg.sender == owner(),
            "Unauthorized Entity"
        );
    } 
}