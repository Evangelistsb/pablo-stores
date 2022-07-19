// SPDX-License-Identifier: MIT

pragma solidity >= 0.7.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract PabloStores {  
    
    uint256 private total;   
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1; 

    struct Package {
        address payable seller;
        uint256 cost;
        uint256 amountIn;        
        string name;
        string imageUrl;
        string description;
        uint256[] percentOut;
        address[] buyers;
    }

    mapping(uint256 => Package) private packages; 
    mapping(uint256 => mapping(address => uint256)) private addressToAmountPaid;

    // create a package
    function createPackage(
        string memory _name,
        string memory _imageUrl,
        string memory _description,
        uint256 _cost     
    ) public {
        require(bytes(_name).length > 0, "invalid name argument");
        require(bytes(_imageUrl).length > 0, "invalid imageUrl argument");
        require(bytes(_description).length > 0, "invalid description argument");
        require(msg.sender != address(0), "invalid caller");
        address[] memory buyers;
        uint256[] memory percentOut;
        uint256 amountIn = 0;
        packages[total++] = Package(
            payable(msg.sender),
            _cost,
            amountIn,
            _name,
            _imageUrl,
            _description,
            percentOut,
            buyers
        );
    }

    // get a package
    function getPackage(uint256 _index) public view returns(
        uint256,
        uint256,
        string memory,
        string memory,
        string memory,
        uint256[] memory,
        address[] memory
    ) {
        require(_index < total, "index out of range");
        return (            
            packages[_index].cost,
            packages[_index].amountIn,
            packages[_index].name,
            packages[_index].imageUrl,
            packages[_index].description,
            packages[_index].percentOut,
            packages[_index].buyers
        );
    }

    // buy a package from market place
    function buyPackage(uint _index, uint256 _percent) public payable  {
        require(_index < total, "index out of range");
        require((_percent >= 0) && (_percent <=100), "invalid percent value");
        
        Package storage package = packages[_index];        
        uint256 amount = (package.cost * _percent) / 100;  
        bool success = _safeTransfer(msg.sender, package.seller, amount);
        require(success, "Failed to transfer"); 
        package.percentOut.push(_percent);
        package.buyers.push(payable(msg.sender));
        addressToAmountPaid[_index][msg.sender] += amount;
        package.amountIn += amount;
    }

    // safely transfer funds from one account to another
    function _safeTransfer(address _from, address _to, uint256 _amount) private returns (bool) {
        bool transferred = IERC20Token(cUsdTokenAddress).transferFrom( _from, _to, _amount);
        return transferred;
    }

    // return amount paid on a package
    function getAmountPaid(uint256 _index, address _buyer) public view returns (uint256) {
        require(_index < total, "index out of range");
        require(_buyer != address(0), "invalid buyer argument");
        uint256 amountPaid = addressToAmountPaid[_index][_buyer];
        return amountPaid;
    }

    // get length of all packages
    function getIndex() public view returns (uint256) {
        return total;
    }
}