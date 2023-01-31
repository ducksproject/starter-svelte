<script>
    import App from "./App.svelte";

    let symbole = "🌞";
    function toggle() {
        window.document.body.classList.toggle('dark-mode');
        if (symbole == "🌕"){
            symbole = "🌞";
        } else {
            symbole = "🌕";
        }
    }
</script>
    <button on:click={toggle}>
        <div style="margin-top: -3px; margin-left: -4px;">
            <h1>{symbole}</h1>
            <slot/>
        </div>
    </button>
    <style>
        button {
            background-color: #A31B3F;
            color: white;
            border: none;
            border-radius: 4px;
            width: 68px;
            height: 68px;
        }
        :global(body.dark-mode) button {
            background-color: #A31B3F;
            color: white;
        }
    </style>