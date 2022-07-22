// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract PabloStores {
    uint256 private total;
    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Package {
        address payable seller;
        uint256 cost;
        string name;
        string imageUrl;
        string description;
        uint percentLeft;
        uint buyersCount;
        Buyer[4] buyers;
    }

    struct Buyer {
        address buyer;
        uint percentBought;
    }

    mapping(uint256 => Package) private packages;
    mapping(uint256 => mapping(address => uint256)) private addressToAmountPaid;

    /// @dev checks if package exist
    modifier exist(uint _index) {
        require(_index < total, "index out of range");
        _;
    }

    /// @dev create a package
    function createPackage(
        string memory _name,
        string memory _imageUrl,
        string memory _description,
        uint256 _cost
    ) public {
        require(bytes(_name).length > 0, "invalid name argument");
        require(bytes(_imageUrl).length > 0, "invalid imageUrl argument");
        require(bytes(_description).length > 0, "invalid description argument");
        require(_cost >= 1 ether, "invalid cost argument");
        require(msg.sender != address(0), "invalid caller");
        Package storage package = packages[total++];
        package.seller = payable(msg.sender);
        package.cost = _cost;
        package.name = _name;
        package.imageUrl = _imageUrl;
        package.description = _description;
        package.percentLeft = 100;
        package.buyersCount = 0;
    }

    /// @dev get a package
    function getPackage(uint256 _index)
        public
        view
        exist(_index)
        returns (Package memory)
    {
        return packages[_index];
    }

    /// @dev buy a package from market place
    function buyPackage(uint _index, uint256 _percent)
        external
        payable
        exist(_index)
    {
        require(
            packages[_index].seller != msg.sender,
            "Can't buy your own package"
        );
        require(
            _percent == 25 ||
                _percent == 50 ||
                _percent == 75 ||
                _percent == 100,
            "invalid percent value"
        );
        require(_percent <= packages[_index].percentLeft, "sold out");
        Package storage package = packages[_index];
        uint256 amount = (package.cost * _percent) / 100;
        package.buyers[package.buyersCount] = Buyer(msg.sender, _percent);
        package.buyersCount++;
        package.percentLeft -= _percent;
        addressToAmountPaid[_index][msg.sender] += amount;
        bool success = _safeTransfer(msg.sender, package.seller, amount);
        require(success, "Failed to transfer");
    }

    /// @dev safely transfer funds from one account to another
    function _safeTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) private returns (bool) {
        require(_to != address(0), "Invalid recipient");
        bool transferred = IERC20Token(cUsdTokenAddress).transferFrom(
            _from,
            _to,
            _amount
        );
        return transferred;
    }

    /// @dev return amount paid on a package
    function getAmountPaid(uint256 _index, address _buyer)
        public
        view
        exist(_index)
        returns (uint256)
    {
        require(_buyer != address(0), "invalid buyer argument");
        uint256 amountPaid = addressToAmountPaid[_index][_buyer];
        return amountPaid;
    }

    /// @dev get length of all packages
    function getIndex() public view returns (uint256) {
        return total;
    }
}
