<script>
    import NavBar from "./NavBar.svelte";
	import NightModeButton from "./NightModeButton.svelte";
	import Dashboard from "./Dashboard.svelte";
	import Docs from "./Docs.svelte";
	import Construction from "./Construction.svelte";
	import Footer from "./Footer.svelte";

	export let name;
	window.addEventListener("resize", function() {
		window.resizeTo(window.innerWidth, window.innerHeight);
	});

	import { onMount } from "svelte";
	let showDashboard = false;
	let showDocs = false;
	let showMinigames = false;
	let showFarm = false;
	let showLeaderboard = false;
	let showStaking = false;

	function updateA() {
		showDashboard = window.location.hash.includes('dashboard');
		showDocs = window.location.hash.includes('docs');
		showMinigames = window.location.hash.includes('minigames');
		showFarm = window.location.hash.includes('farm');
		showLeaderboard = window.location.hash.includes('leaderboard');
		showStaking = window.location.hash.includes('staking');
	}

	window.location.hash = '';

	onMount(() => {
		updateA();
		window.addEventListener('hashchange', updateA);
	});
</script>

<svelte:head>
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

	<title>Radix web App - Ducks Mafia</title>
	<link href='Gamepixies-8MO6n.ttf' rel='stylesheet' type='text/css'>
</svelte:head>


<main>
	<div style="display: flex;">
		<div class="Uppopup" style="width: 75%; background-color: lightblue; border-radius: 25px 25px 0px 0px;">
			<h6 style="margin: 15px 5% 5px 5%; font-weight: 700;"><a href="https://twitter.com/ducksmafiaxrd" target="_blank">The Duck Mafia</a> invites you to join its web3 community P2E game hosted on <a href="https://www.radixdlt.com/" target="_blank">RadixDLT, a place where DeFi can thrive.</a></h6>
		</div>
		<div style="width: 5%;margin: 5px">
			<NightModeButton></NightModeButton>
		</div>
		<div style="width: 20%; margin: 0.1em; width: 172px;margin-left:50px">
			<radix-connect-button/>
		</div>
	</div>
	<NavBar></NavBar>
	
	{#if showDashboard}
		<Dashboard></Dashboard>
	{:else if showDocs}
		<Docs></Docs>
	{:else if showMinigames}
		<Construction></Construction>
	{:else if showFarm}
		<Construction></Construction>
	{:else if showLeaderboard}
		<Construction></Construction>
	{:else if showStaking}
		<Construction></Construction>
	{:else}
		<Dashboard></Dashboard>
	{/if}

	<Footer></Footer>

	<script  src="./script.js"></script>
</main>

<style>
	body{
	font-family: 'Roboto', sans-serif;
	}

	.Uppopup {
		font-family: "Open Sans", sans-serif;
	}

	:global(body) {
		background-color: #f2ce2ecf;
		color: #0084f6;
		transition: background-color 0.3s
	}
	:global(body.dark-mode) {
		background-color: #1d3040;
		color: #5161ce;
	}
</style>