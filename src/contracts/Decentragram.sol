pragma solidity ^0.5.0;

contract Decentragram {
    string public name = "Decentragram";
    uint256 public imageCount = 0;
    mapping(uint256 => Image) public images;

    struct Image {
        uint256 id;
        string hash;
        string description;
        uint256 tipAmount;
        address payable author;
    }

    event ImageCreated(
        uint256 id,
        string hash,
        string description,
        uint256 tipAmount,
        address payable author
    );

    event ImageTipped(
        uint256 id,
        string hash,
        string description,
        uint256 tipAmount,
        address payable author
    );

    // Upload Images
    function uploadImage(string calldata _imgHash, string calldata _description)
        external
    {
        // Make sure that image hash exists
        require(bytes(_imgHash).length > 0);

        // Make sure that description exists
        require(bytes(_description).length > 0);

        // Make sure that uploader address exists
        require(msg.sender != address(0x0));

        // Increment image count
        imageCount += 1;

        // Store the image
        images[imageCount] = Image(
            imageCount,
            _imgHash,
            _description,
            0,
            msg.sender
        );

        // Trigger event
        emit ImageCreated(imageCount, _imgHash, _description, 0, msg.sender);
    }

    // Tip Images
    function tipImageOwner(uint256 _id) external payable {
        // Make sure the id is valid
        require(_id > 0 && _id <= imageCount);

        // Fetch the image
        Image memory _image = images[_id];

        // Fetch author
        address payable _author = _image.author;

        // Pay the author by sending them ether
        address(_author).transfer(msg.value);

        // Increment the tip amount
        _image.tipAmount += msg.value;

        // Update the image
        images[_id] = _image;

        // Trigger an event
        emit ImageTipped(
            _id,
            _image.hash,
            _image.description,
            _image.tipAmount,
            _author
        );
    }
}
