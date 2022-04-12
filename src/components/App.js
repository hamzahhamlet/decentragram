import React, { Component } from "react";
import Web3 from "web3";
import Identicon from "identicon.js";
import "./App.css";
import Decentragram from "../abis/Decentragram.json";
import Navbar from "./Navbar";
import Main from "./Main";

const ipfsClient = require("ipfs-http-client");
const ipfs = ipfsClient({
	host: "ipfs.infura.io",
	port: 5001,
	protocol: "https",
});

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			account: "",
			decentragram: undefined,
			imagesCount: 0,
			images: [],
			loading: true,
		};
	}

	async componentDidMount() {
		await this.loadWeb3();
		await this.loadBlockchainData();
	}

	loadWeb3 = async () => {
		if (window.ethereum) {
			window.web3 = new Web3(window.ethereum);
			await window.ethereum.enable();
		} else if (window.web3) {
			window.web3 = new Web3(window.web3.currentProvider);
		} else {
			window.alert(
				"Non-ethereum browser detected. You should consider trying Metamask."
			);
		}
	};

	loadBlockchainData = async () => {
		const web3 = window.web3;
		const accounts = await web3.eth.getAccounts();
		this.setState({ account: accounts[0] });

		// Get the connected network id
		const networkId = await web3.eth.net.getId();
		const networkData = Decentragram.networks[networkId];

		if (networkData) {
			const decentragram = new web3.eth.Contract(
				Decentragram.abi,
				networkData.address
			);
			const imagesCount = await decentragram.methods.imageCount().call();
			const images = [];

			for (let i = 1; i <= imagesCount; i++) {
				const image = await decentragram.methods.images(i).call();
				images.push(image);
			}

			this.setState({ decentragram, imagesCount, images });
		} else {
			alert("Decentagram contract is not deployed to detected network");
		}

		this.setState({ loading: false });
	};

	captureFile = (e) => {
		e.preventDefault();
		const file = e.target.files[0];
		const reader = new window.FileReader();
		reader.readAsArrayBuffer(file);

		reader.onloadend = () => {
			this.setState({ buffer: Buffer(reader.result) });
			console.log("buffer", this.state.buffer);
		};
	};

	uploadImage = (description) => {
		console.log("Submitting file to ipfs...");

		ipfs.add(this.state.buffer, (error, result) => {
			console.log("Ipfs result", result);

			if (error) {
				console.error(error);
				return;
			}

			this.setState({ loading: true });
			this.state.decentragram.methods
				.uploadImage(result[0].hash, description)
				.send({ from: this.state.account })
				.on("transactionHash", (hash) => {
					console.log(hash);
					this.setState({ loading: false });
				});
		});
	};

	tipImageOwner = (id, tipAmount) => {
		this.setState({ loading: true });
		this.state.decentragram.methods
			.tipImageOwner(id)
			.send({
				from: this.state.account,
				value: tipAmount,
			})
			.on("transactionHash", (hash) => {
				console.log(hash);
				this.setState({ loading: false });
			});
	};

	render() {
		return (
			<div>
				<Navbar account={this.state.account} />
				{this.state.loading ? (
					<div id="loader" className="text-center mt-5">
						<p>Loading...</p>
					</div>
				) : (
					<Main
						images={this.state.images}
						captureFile={this.captureFile}
						uploadImage={this.uploadImage}
						tipImageOwner={this.tipImageOwner}
					/>
				)}
			</div>
		);
	}
}

export default App;
