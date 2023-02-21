<script>
    import App from "./App.svelte";
</script>

<div style="background-color: white;">
    <div class="content">
        <section>
            <div class="col-66"><div class="square col-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 1"/>
              <div class="mask">
              </div><div class="inbox">
                <div class="intInbox flexBox">
                    <h3 class="title1" style="color: #8b0025"><u>The ducks mafia Play-to-Earn Arcade is Soon Open!</u></h3>
                    <div style="margin: 5px; text-align: center; font-weight: 800">
                      <p>
                        Welcome to our RadApp where we bring together the world of decentralized finance, interactive game and staking with entertainment. Our platform allows you to play in a secure and decentralized way, while enjoying exciting games and earning lucrative rewards. Get ready for an unprecedented experience where finance and fun collide, join us now and be part of the future of finance.
                      </p>
                    </div>
                    </div>
              </div>
            </div><div class="square col-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 1"/>
              <div class="mask">
              </div><div class="inbox">
                <div class="intInbox flexBox">
                  <h3 class="title1">Play with <a href="#">$DUCKT</a> to earn rewards!</h3>
                  <img width="120px" style="display: block;width: 50%;margin: auto;" src="ducktlogo.png" alt="duckt logo"/>
                </div>
              </div>
            </div></div><div class="square col-33">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 2"/>
              <div class="mask">
              </div><div class="inbox">
                <div class="intInbox flexBoxA" style="">
                    <div style="border-radius: 25px; margin: 10%;background-color: #adfeff; min-width: 80%; min-height: 80%" class="">
                      <div style="font-size: 1.3em;font-weight: 800;color: #0b1824;font-family: var(--font-family); text-align: center;width: 90%; margin: 5%">
                        <u>$DUCKT price :</u> <a href="#">?</a>
                        <br>
                        <u>24h Vol :</u> <a href="#">?</a> 
                        <br>
                        <u>Market Cap :</u> <a href="#">?</a>
                        <br>
                        <u>Players :</u> <a href="#">?</a>
                        <br>
                        
                      </div>
                      <div style="border-radius: 15px;width: 80%; margin-left: 10%;margin-right: 10%; background-color: #ffd000; text-align: center; font-family: var(--font-family2); text-decoration: none;font-size: 1.5em;font-weight: 500;" class="">
                        <a href="https://ociswap.com/ducks-mafia/" style=";color: #a23351">Buy DUCKTS</a>
                      </div>
                      <div style="border-radius: 15px;margin-top: 10px;width: 80%; margin-left: 10%;margin-right: 10%; background-color: #ffd000; text-align: center; font-family: var(--font-family2); text-decoration: none;font-size: 1.5em;font-weight: 500;" class="">
                        <a href="#" style=";color: #a23351">Claim/Buy a Nursery</a>
                      </div>
                      <hr style="background-color: black; width: 60%; margin: 20%">
                      <div style="text-align:center;width: 20%; margin: 0.1em; width: 172px;margin-left:50px">
                        
                        <radix-connect-button/>
                        <h2 style="margin-top: 25px">Waiting Wallet</h2>
                      </div>
                    </div>
                </div>
              </div>
            </div>
            
            <div class="square col-33">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>
              <div class="mask">
              </div><div class="inbox">
                <div class="intInbox flexBox">
                  <h1 style="display : block; font-family: var(--font-family2);text-align:center;color: #062441; text-decoration: none"><a href="#">Play</a></h1>
                  <img style="width: 70%;display: block;margin: auto;" src="play.png" />
                </div>
              </div>
            </div><div class="square col-33">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>
              <div class="mask">
              </div><div class="inbox">
                <div class="intInbox flexBox">
                  <h1 style="display : block; font-family: var(--font-family2);text-align:center;color: #062441; text-decoration: none"><a href="#">Whitepaper</a></h1>
                  <img style="width: 70%;display: block;margin: auto;" src="whitepaper.png" />
                </div>
              </div>
            </div><div class="square col-33">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>
              <div class="mask">
              </div><div class="inbox">
                <div class="intInbox flexBox">
                  <h1 style="display : block; font-family: var(--font-family2);text-align:center;color: #062441; text-decoration: none"><a href="#docs">Docs</a></h1>
                  <img style="width: 70%;display: block;margin: auto;" src="docs.png" />
                </div>
              </div>
            </div>
          </section>
    </div>
</div>

<style>

    .flexBox .title1 {
      font-family: var(--font-family2);
      color: #072e54;
      margin: 25px;
    }

    .flexBox {
      overflow: scroll;
      overflow-x: hidden;
      
    }

.flexBoxA {
  overflow: scroll;
  overflow-x: scroll;
  
}
    

    .intInbox::-webkit-scrollbar
    {
      width: 12px;
    }
    .intInbox::-webkit-scrollbar-thumb
    {
      border-radius: 10px;
      -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
      background-color: #a31b3f;
    }

    .content {
        background-image: url('/background.png');
        width: 100%;
        min-height: 500px;
        opacity: 0.8;
        background-position: center;
    }
    
    .content .square  {
        font-size: 1rem;
        display: inline-block;
        position: relative;
        box-sizing: border-box;
        border: 15px solid #fff0;
    }
    .content .square > svg {
    width: 100%;
    height: auto;
    display: block;
    }
    .content .square .inbox {
    border: 15px solid rgb(97 79 64); /*USELESS*/
    border-left: 15px solid hsl(27deg 20% 20%);
    border-bottom: 15px solid hsl(27deg 20% 20%);
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    }
    
    .content .square .intInbox {
    border: 15px solid rgb(116 94 76); /*USELESS*/
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: hsla(39,44%,87%,.9);;
    }

    .content .square .mask {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-image: url('/wood-mask.svg');
    opacity: 0.5;
    }


    /*USELESS_BLOCK*/
    .content .col-25 {
    width: 25%;
    }
    .content .col-50 {
    width: 50%;
    }
    .content .col-33 {
    width: 33.33%;
    }
    .content .col-66 {
    width: 66.66%;
    }
    .content .col-100 {
    width: 100%;
    }
    .content div {display: inline-block;}
    .content section {
    width: 80%;
    display: block;
    margin: auto;
    font-size: 0;
    }
    .content h3 {
    font-family: arial;
    color: #FFF;
    text-align: center;
    font-weight: normal;
    }
    /*END USELESS_BLOCK*/
</style>