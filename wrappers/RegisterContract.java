package wrappers;

import io.reactivex.Flowable;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import org.web3j.abi.EventEncoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Event;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameter;
import org.web3j.protocol.core.RemoteCall;
import org.web3j.protocol.core.RemoteFunctionCall;
import org.web3j.protocol.core.methods.request.EthFilter;
import org.web3j.protocol.core.methods.response.BaseEventResponse;
import org.web3j.protocol.core.methods.response.Log;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.Contract;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;

/**
 * <p>Auto generated code.
 * <p><strong>Do not modify!</strong>
 * <p>Please use the <a href="https://docs.web3j.io/command_line.html">web3j command line tools</a>,
 * or the org.web3j.codegen.SolidityFunctionWrapperGenerator in the 
 * <a href="https://github.com/web3j/web3j/tree/master/codegen">codegen module</a> to update.
 *
 * <p>Generated with web3j version 1.5.0.
 */
@SuppressWarnings("rawtypes")
public class RegisterContract extends Contract {
    public static final String BINARY = "0x608060405234801561000f575f80fd5b50335f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610081575f6040517f1e4fbdf70000000000000000000000000000000000000000000000000000000081526004016100789190610196565b60405180910390fd5b6100908161009660201b60201c565b506101af565b5f805f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050815f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61018082610157565b9050919050565b61019081610176565b82525050565b5f6020820190506101a95f830184610187565b92915050565b610a86806101bc5f395ff3fe608060405234801561000f575f80fd5b5060043610610055575f3560e01c8063715018a6146100595780638da5cb5b1461006357806392826b4814610081578063bd9f5d501461009d578063f2fde38b146100b9575b5f80fd5b6100616100d5565b005b61006b6100e8565b604051610078919061057d565b60405180910390f35b61009b600480360381019061009691906105d1565b61010f565b005b6100b760048036038101906100b29190610698565b61015a565b005b6100d360048036038101906100ce91906105d1565b610313565b005b6100dd610397565b6100e65f61041e565b565b5f805f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b610117610397565b8060015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b5f60015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a08c0bba336040518263ffffffff1660e01b81526004016101b5919061057d565b5f60405180830381865afa1580156101cf573d5f803e3d5ffd5b505050506040513d5f823e3d601f19601f820116820180604052508101906101f79190610877565b9050610238816040518060400160405280600981526020017f4f7267616e697a657200000000000000000000000000000000000000000000008152506104df565b610277576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161026e9061093e565b60405180910390fd5b60015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663e0bcf066888888888888336040518863ffffffff1660e01b81526004016102dd9796959493929190610989565b5f604051808303815f87803b1580156102f4575f80fd5b505af1158015610306573d5f803e3d5ffd5b5050505050505050505050565b61031b610397565b5f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361038b575f6040517f1e4fbdf7000000000000000000000000000000000000000000000000000000008152600401610382919061057d565b60405180910390fd5b6103948161041e565b50565b61039f610537565b73ffffffffffffffffffffffffffffffffffffffff166103bd6100e8565b73ffffffffffffffffffffffffffffffffffffffff161461041c576103e0610537565b6040517f118cdaa7000000000000000000000000000000000000000000000000000000008152600401610413919061057d565b60405180910390fd5b565b5f805f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050815f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b5f816040516020016104f19190610a3a565b60405160208183030381529060405280519060200120836040516020016105189190610a3a565b6040516020818303038152906040528051906020012014905092915050565b5f33905090565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6105678261053e565b9050919050565b6105778161055d565b82525050565b5f6020820190506105905f83018461056e565b92915050565b5f604051905090565b5f80fd5b5f80fd5b6105b08161055d565b81146105ba575f80fd5b50565b5f813590506105cb816105a7565b92915050565b5f602082840312156105e6576105e561059f565b5b5f6105f3848285016105bd565b91505092915050565b5f819050919050565b61060e816105fc565b8114610618575f80fd5b50565b5f8135905061062981610605565b92915050565b5f819050919050565b6106418161062f565b811461064b575f80fd5b50565b5f8135905061065c81610638565b92915050565b5f60ff82169050919050565b61067781610662565b8114610681575f80fd5b50565b5f813590506106928161066e565b92915050565b5f805f805f8060c087890312156106b2576106b161059f565b5b5f6106bf89828a0161061b565b96505060206106d089828a0161061b565b95505060406106e189828a0161064e565b94505060606106f289828a0161064e565b935050608061070389828a0161064e565b92505060a061071489828a01610684565b9150509295509295509295565b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b61076f82610729565b810181811067ffffffffffffffff8211171561078e5761078d610739565b5b80604052505050565b5f6107a0610596565b90506107ac8282610766565b919050565b5f67ffffffffffffffff8211156107cb576107ca610739565b5b6107d482610729565b9050602081019050919050565b5f5b838110156107fe5780820151818401526020810190506107e3565b5f8484015250505050565b5f61081b610816846107b1565b610797565b90508281526020810184848401111561083757610836610725565b5b6108428482856107e1565b509392505050565b5f82601f83011261085e5761085d610721565b5b815161086e848260208601610809565b91505092915050565b5f6020828403121561088c5761088b61059f565b5b5f82015167ffffffffffffffff8111156108a9576108a86105a3565b5b6108b58482850161084a565b91505092915050565b5f82825260208201905092915050565b7f4f6e6c79206f7267616e697a6572732063616e2063616c6c20746869732066755f8201527f6e6374696f6e2100000000000000000000000000000000000000000000000000602082015250565b5f6109286027836108be565b9150610933826108ce565b604082019050919050565b5f6020820190508181035f8301526109558161091c565b9050919050565b610965816105fc565b82525050565b6109748161062f565b82525050565b61098381610662565b82525050565b5f60e08201905061099c5f83018a61095c565b6109a9602083018961095c565b6109b6604083018861096b565b6109c3606083018761096b565b6109d0608083018661096b565b6109dd60a083018561097a565b6109ea60c083018461056e565b98975050505050505050565b5f81519050919050565b5f81905092915050565b5f610a14826109f6565b610a1e8185610a00565b9350610a2e8185602086016107e1565b80840191505092915050565b5f610a458284610a0a565b91508190509291505056fea264697066735822122041d825c3f49b63aac56039e1e8fb4dae75383117717cd5efb2c258491e0a958864736f6c63430008140033";

    public static final String FUNC_OWNER = "owner";

    public static final String FUNC_RENOUNCEOWNERSHIP = "renounceOwnership";

    public static final String FUNC_TRANSFEROWNERSHIP = "transferOwnership";

    public static final String FUNC_REGISTERTICKET = "registerTicket";

    public static final String FUNC_SETTICKETCONTRACTADDRESS = "setTicketContractAddress";

    public static final Event OWNERSHIPTRANSFERRED_EVENT = new Event("OwnershipTransferred", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Address>(true) {}, new TypeReference<Address>(true) {}));
    ;

    protected static final HashMap<String, String> _addresses;

    static {
        _addresses = new HashMap<String, String>();
    }

    @Deprecated
    protected RegisterContract(String contractAddress, Web3j web3j, Credentials credentials, BigInteger gasPrice, BigInteger gasLimit) {
        super(BINARY, contractAddress, web3j, credentials, gasPrice, gasLimit);
    }

    protected RegisterContract(String contractAddress, Web3j web3j, Credentials credentials, ContractGasProvider contractGasProvider) {
        super(BINARY, contractAddress, web3j, credentials, contractGasProvider);
    }

    @Deprecated
    protected RegisterContract(String contractAddress, Web3j web3j, TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        super(BINARY, contractAddress, web3j, transactionManager, gasPrice, gasLimit);
    }

    protected RegisterContract(String contractAddress, Web3j web3j, TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        super(BINARY, contractAddress, web3j, transactionManager, contractGasProvider);
    }

    public static List<OwnershipTransferredEventResponse> getOwnershipTransferredEvents(TransactionReceipt transactionReceipt) {
        List<Contract.EventValuesWithLog> valueList = staticExtractEventParametersWithLog(OWNERSHIPTRANSFERRED_EVENT, transactionReceipt);
        ArrayList<OwnershipTransferredEventResponse> responses = new ArrayList<OwnershipTransferredEventResponse>(valueList.size());
        for (Contract.EventValuesWithLog eventValues : valueList) {
            OwnershipTransferredEventResponse typedResponse = new OwnershipTransferredEventResponse();
            typedResponse.log = eventValues.getLog();
            typedResponse.previousOwner = (String) eventValues.getIndexedValues().get(0).getValue();
            typedResponse.newOwner = (String) eventValues.getIndexedValues().get(1).getValue();
            responses.add(typedResponse);
        }
        return responses;
    }

    public static OwnershipTransferredEventResponse getOwnershipTransferredEventFromLog(Log log) {
        Contract.EventValuesWithLog eventValues = staticExtractEventParametersWithLog(OWNERSHIPTRANSFERRED_EVENT, log);
        OwnershipTransferredEventResponse typedResponse = new OwnershipTransferredEventResponse();
        typedResponse.log = log;
        typedResponse.previousOwner = (String) eventValues.getIndexedValues().get(0).getValue();
        typedResponse.newOwner = (String) eventValues.getIndexedValues().get(1).getValue();
        return typedResponse;
    }

    public Flowable<OwnershipTransferredEventResponse> ownershipTransferredEventFlowable(EthFilter filter) {
        return web3j.ethLogFlowable(filter).map(log -> getOwnershipTransferredEventFromLog(log));
    }

    public Flowable<OwnershipTransferredEventResponse> ownershipTransferredEventFlowable(DefaultBlockParameter startBlock, DefaultBlockParameter endBlock) {
        EthFilter filter = new EthFilter(startBlock, endBlock, getContractAddress());
        filter.addSingleTopic(EventEncoder.encode(OWNERSHIPTRANSFERRED_EVENT));
        return ownershipTransferredEventFlowable(filter);
    }

    public RemoteFunctionCall<String> owner() {
        final Function function = new Function(FUNC_OWNER, 
                Arrays.<Type>asList(), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Address>() {}));
        return executeRemoteCallSingleValueReturn(function, String.class);
    }

    public RemoteFunctionCall<TransactionReceipt> renounceOwnership() {
        final Function function = new Function(
                FUNC_RENOUNCEOWNERSHIP, 
                Arrays.<Type>asList(), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<TransactionReceipt> transferOwnership(String newOwner) {
        final Function function = new Function(
                FUNC_TRANSFEROWNERSHIP, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.Address(newOwner)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<TransactionReceipt> registerTicket(BigInteger _eventId, BigInteger _ticketId, byte[] _hashedMessage, byte[] _r, byte[] _s, BigInteger _v) {
        final Function function = new Function(
                FUNC_REGISTERTICKET, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(_eventId), 
                new org.web3j.abi.datatypes.generated.Uint256(_ticketId), 
                new org.web3j.abi.datatypes.generated.Bytes32(_hashedMessage), 
                new org.web3j.abi.datatypes.generated.Bytes32(_r), 
                new org.web3j.abi.datatypes.generated.Bytes32(_s), 
                new org.web3j.abi.datatypes.generated.Uint8(_v)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<TransactionReceipt> setTicketContractAddress(String _ticketAddress) {
        final Function function = new Function(
                FUNC_SETTICKETCONTRACTADDRESS, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.Address(_ticketAddress)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    @Deprecated
    public static RegisterContract load(String contractAddress, Web3j web3j, Credentials credentials, BigInteger gasPrice, BigInteger gasLimit) {
        return new RegisterContract(contractAddress, web3j, credentials, gasPrice, gasLimit);
    }

    @Deprecated
    public static RegisterContract load(String contractAddress, Web3j web3j, TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        return new RegisterContract(contractAddress, web3j, transactionManager, gasPrice, gasLimit);
    }

    public static RegisterContract load(String contractAddress, Web3j web3j, Credentials credentials, ContractGasProvider contractGasProvider) {
        return new RegisterContract(contractAddress, web3j, credentials, contractGasProvider);
    }

    public static RegisterContract load(String contractAddress, Web3j web3j, TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        return new RegisterContract(contractAddress, web3j, transactionManager, contractGasProvider);
    }

    public static RemoteCall<RegisterContract> deploy(Web3j web3j, Credentials credentials, ContractGasProvider contractGasProvider) {
        return deployRemoteCall(RegisterContract.class, web3j, credentials, contractGasProvider, BINARY, "");
    }

    public static RemoteCall<RegisterContract> deploy(Web3j web3j, TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        return deployRemoteCall(RegisterContract.class, web3j, transactionManager, contractGasProvider, BINARY, "");
    }

    @Deprecated
    public static RemoteCall<RegisterContract> deploy(Web3j web3j, Credentials credentials, BigInteger gasPrice, BigInteger gasLimit) {
        return deployRemoteCall(RegisterContract.class, web3j, credentials, gasPrice, gasLimit, BINARY, "");
    }

    @Deprecated
    public static RemoteCall<RegisterContract> deploy(Web3j web3j, TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        return deployRemoteCall(RegisterContract.class, web3j, transactionManager, gasPrice, gasLimit, BINARY, "");
    }

    protected String getStaticDeployedAddress(String networkId) {
        return _addresses.get(networkId);
    }

    public static String getPreviouslyDeployedAddress(String networkId) {
        return _addresses.get(networkId);
    }

    public static class OwnershipTransferredEventResponse extends BaseEventResponse {
        public String previousOwner;

        public String newOwner;
    }
}
