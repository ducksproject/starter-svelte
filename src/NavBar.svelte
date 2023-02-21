<script>
    import App from "./App.svelte";

</script>
<svelte:head>
	<link rel='stylesheet' href='bootstrap.min.css'>
	<link rel="stylesheet" href="./navbarstyle.css">
</svelte:head>

<nav class="navbar navbar-expand-custom navbar-mainbg">
    <img class="ducktLogo" style="margin-right: 25px; margin-left: 25px" src="logo.gif" alt="logo">

    <a class="navbar-brand navbar-logo" href="#" style="text-decoration: none;color: white;font-weight: 700;">Ducks mafia DApp</a>
    <button class="navbar-toggler" type="button" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>
    </button>
    <div class="collapsingBar collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav ml-auto">
            <div class="hori-selector"><div class="left"></div><div class="right"></div></div>
            
            <li class="nav-item active dashboardItem">
                <a class="nav-link" href="#dashboard"><i class="fas fa-tachometer-alt"></i>Dashboard</a>
            </li>
            
            <li class="nav-item">
                <a class="nav-link" href="#docs"><i class="fa fa-link"></i>Docs & Links</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#minigames"><i class="fas fa-tachometer-alt"></i><strike>Minigames</strike></a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#farm"><i class="fas fa-tachometer-alt"></i><strike>Farm</strike></a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#leaderboard"><i class="fas fa-tachometer-alt"></i><strike>Leaderboard</strike></a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#staking"><i class="far fa-image"></i><strike>Passive staking</strike></a>
            </li>
        </ul>
    </div>
</nav>

<style>
    nav {
        font-family: var(--font-family2);
    }

    .ducktLogo {
        width:  70px;
    }

    @media (min-width: 992px){
        .collapsingBar{
            margin-bottom: -7px;
        }
    }
    
</style>