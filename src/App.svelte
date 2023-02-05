<script>
    import NavBar from "./NavBar.svelte";
	import NightModeButton from "./NightModeButton.svelte";
	import Content from "./Content.svelte";
	import Footer from "./Footer.svelte";

	export let name;
	window.addEventListener("resize", function() {
		window.resizeTo(window.innerWidth, window.innerHeight);
	});
</script>

<svelte:head>
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">

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
	
	<Content></Content>

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
		color: #4d963f;
	}
</style>