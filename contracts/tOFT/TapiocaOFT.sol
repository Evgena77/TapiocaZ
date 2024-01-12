// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;
import "./BaseTOFT.sol";

contract TapiocaOFT is BaseTOFT, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using BytesLib for bytes;

    /// @notice creates a new TapiocaOFT
    /// @param _lzEndpoint LayerZero endpoint address
    /// @param _erc20 true the underlying ERC20 address
    /// @param _yieldBox the YieldBox address
    /// @param _name the TOFT name
    /// @param _symbol the TOFT symbol
    /// @param _decimal the TOFT decimal
    /// @param _hostChainID the TOFT host chain LayerZero id
    constructor(
        address _lzEndpoint,
        address _erc20,
        IYieldBoxBase _yieldBox,
        ICluster _cluster,
        string memory _name,
        string memory _symbol,
        uint8 _decimal,
        uint256 _hostChainID,
        BaseTOFTLeverageModule __leverageModule,
        BaseTOFTLeverageDestinationModule __leverageDestinationModule,
        BaseTOFTMarketModule __marketModule,
        BaseTOFTMarketDestinationModule __marketDestinationModule,
        BaseTOFTOptionsModule __optionsModule,
        BaseTOFTOptionsDestinationModule __optionsDestinationModule,
        BaseTOFTGenericModule __genericModule
    )
        BaseTOFT(
            _lzEndpoint,
            _erc20,
            _yieldBox,
            _cluster,
            _name,
            _symbol,
            _decimal,
            _hostChainID,
            __leverageModule,
            __leverageDestinationModule,
            __marketModule,
            __marketDestinationModule,
            __optionsModule,
            __optionsDestinationModule,
            __genericModule
        )
    {}

    // ************************ //
    // *** PUBLIC FUNCTIONS *** //
    // ************************ //
    /// @notice Wrap an ERC20 with a 1:1 ratio with a fee if existing.
    /// @dev Since it can be executed only on the main chain, if an address exists on the OP chain it will not allowed to wrap.
    /// @param _fromAddress The address to wrap from.
    /// @param _toAddress The address to wrap the ERC20 to.
    /// @param _amount The amount of ERC20 to wrap.
    function wrap(
        address _fromAddress,
        address _toAddress,
        uint256 _amount
    ) external payable nonReentrant onlyHostChain returns (uint256 minted) {
        if (erc20 == address(0)) {
            _wrapNative(_toAddress);
        } else {
            if (msg.value > 0) revert NotNative();
            _wrap(_fromAddress, _toAddress, _amount);
        }

        return _amount; //no fee for TOFT
    }

    /// @notice Unwrap an ERC20/Native with a 1:1 ratio. Called only on host chain.
    /// @param _toAddress The address to unwrap the tokens to.
    /// @param _amount The amount of tokens to unwrap.

    function unwrap(
        address _toAddress,
        uint256 _amount
    ) external onlyHostChain {
        _unwrap(_toAddress, _amount);
    }
}
