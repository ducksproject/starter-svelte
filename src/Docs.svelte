<script>
    import App from "./App.svelte";

    (function () {
  const second = 1000,
        minute = second * 60,
        hour = minute * 60,
        day = hour * 24;

  //I'm adding this section so I don't have to keep updating this pen every year :-)
  //remove this if you don't need it
  let today = new Date(),
      dd = String(today.getDate()).padStart(2, "0"),
      mm = String(today.getMonth() + 1).padStart(2, "0"),
      yyyy = today.getFullYear(),
      nextYear = yyyy + 1,
      dayMonth = "02/29/",
      birthday = dayMonth + yyyy;
      
  
  today = mm + "/" + dd + "/" + yyyy;
  if (today > birthday) {
    birthday = dayMonth + nextYear;
  }
  //end
  
  const countDown = new Date(birthday).getTime(),
      x = setInterval(function() {    

        const now = new Date().getTime(),
              distance = countDown - now;

        document.getElementById("days").innerText = Math.floor(distance / (day)),
          document.getElementById("hours").innerText = Math.floor((distance % (day)) / (hour)),
          document.getElementById("minutes").innerText = Math.floor((distance % (hour)) / (minute)),
          document.getElementById("seconds").innerText = Math.floor((distance % (minute)) / second);

        //do something later when date is reached
        if (distance < 0) {
          document.getElementById("headline").innerText = "It's my birthday!";
          document.getElementById("countdown").style.display = "none";
          document.getElementById("content").style.display = "block";
          clearInterval(x);
        }
        //seconds
      }, 0)
  }());
</script>

<div style="background-color: white;">
    <div class="content">
      <section>
        <div class="col-100"><div class="square col-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 1"/>
          <div class="mask">
          </div><div class="inbox">
            <div class="intInbox flexBox">
                <h3 class="title1" style="color: #8b0025"><u>Game concept</u></h3>
                <div style="margin: 5px; text-align: center; font-weight: 800">

                </div>
                  <div class="countdown" style="display: block;">
                    <div class="container" style="display: block;" >
                    <h1 id="headline">Explanation of the game and general operation </h1>
                    <div id="countdown">
                      <ul>
                        <li><span id="days"></span>days</li>
                        <li><span id="hours"></span>Hours</li>
                        <li><span id="minutes"></span>Minutes</li>
                        <li><span id="seconds"></span>Seconds</li>
                      </ul>
                    </div>
                    <div id="content" class="emoji">
                      <span>🥳</span>
                      <span>🎉</span>
                      <span>🎂</span>
                    </div>
                  </div>
                </div>
          </div>
        </div>
      </section><section>
        <div class="col-100"><div class="square col-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 1"/>
          <div class="mask">
          </div><div class="inbox">
            <div class="intInbox flexBox">
                <h3 class="title1" style="color: #8b0025"><u>Links</u></h3>
                <div style="margin: 5px; text-align: center; font-weight: 800">
                  <p>
                    Join the team on our various networks to take advantage of exclusive bonuses and promote the Radix network
                  </p>
                </div>
                <div style="width: 80%; margin-right: 10%; margin-left: 10%">
                  <ul>
                    <li>
                    <a href="https://twitter.com/ducksMafiaXRD/">
                      <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.9728 6.7174C20.5084 7.33692 19.947 7.87733 19.3103 8.31776C19.3103 8.47959 19.3103 8.64142 19.3103 8.81225C19.3154 11.7511 18.1415 14.5691 16.0518 16.6345C13.962 18.6999 11.1312 19.8399 8.19405 19.7989C6.49599 19.8046 4.81967 19.4169 3.29642 18.6661C3.21428 18.6302 3.16131 18.549 3.16162 18.4593V18.3604C3.16162 18.2313 3.26623 18.1267 3.39527 18.1267C5.06442 18.0716 6.67402 17.4929 7.99634 16.4724C6.48553 16.4419 5.12619 15.5469 4.5006 14.1707C4.46901 14.0956 4.47884 14.0093 4.52657 13.9432C4.57429 13.8771 4.653 13.8407 4.73425 13.8471C5.19342 13.8932 5.65718 13.8505 6.1002 13.7212C4.43239 13.375 3.17921 11.9904 2.99986 10.2957C2.99349 10.2144 3.02992 10.1357 3.096 10.0879C3.16207 10.0402 3.24824 10.0303 3.32338 10.062C3.77094 10.2595 4.25409 10.3635 4.74324 10.3676C3.28184 9.40846 2.65061 7.58405 3.20655 5.92622C3.26394 5.76513 3.40181 5.64612 3.5695 5.61294C3.73718 5.57975 3.90996 5.63728 4.02432 5.76439C5.99639 7.86325 8.70604 9.11396 11.5819 9.25279C11.5083 8.95885 11.4721 8.65676 11.4741 8.35372C11.501 6.76472 12.4842 5.34921 13.9634 4.76987C15.4425 4.19054 17.1249 4.56203 18.223 5.71044C18.9714 5.56785 19.695 5.31645 20.3707 4.96421C20.4202 4.93331 20.483 4.93331 20.5325 4.96421C20.5634 5.01373 20.5634 5.07652 20.5325 5.12604C20.2052 5.87552 19.6523 6.50412 18.9509 6.92419C19.5651 6.85296 20.1685 6.70807 20.7482 6.49264C20.797 6.45942 20.8611 6.45942 20.9099 6.49264C20.9508 6.51134 20.9814 6.54711 20.9935 6.59042C21.0056 6.63373 20.998 6.68018 20.9728 6.7174Z" fill="CurrentColor"></path>
                        </svg>
                        Twitter : ducksMafiaXRD
                    </a>
                    </li>
                    <li>
                    <a href="https://t.me/ducksmafiaxrd">
                      <svg width="24px" height="24px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" fill="currentColor" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;"><path id="telegram-1" d="M18.384,22.779c0.322,0.228 0.737,0.285 1.107,0.145c0.37,-0.141 0.642,-0.457 0.724,-0.84c0.869,-4.084 2.977,-14.421 3.768,-18.136c0.06,-0.28 -0.04,-0.571 -0.26,-0.758c-0.22,-0.187 -0.525,-0.241 -0.797,-0.14c-4.193,1.552 -17.106,6.397 -22.384,8.35c-0.335,0.124 -0.553,0.446 -0.542,0.799c0.012,0.354 0.25,0.661 0.593,0.764c2.367,0.708 5.474,1.693 5.474,1.693c0,0 1.452,4.385 2.209,6.615c0.095,0.28 0.314,0.5 0.603,0.576c0.288,0.075 0.596,-0.004 0.811,-0.207c1.216,-1.148 3.096,-2.923 3.096,-2.923c0,0 3.572,2.619 5.598,4.062Zm-11.01,-8.677l1.679,5.538l0.373,-3.507c0,0 6.487,-5.851 10.185,-9.186c0.108,-0.098 0.123,-0.262 0.033,-0.377c-0.089,-0.115 -0.253,-0.142 -0.376,-0.064c-4.286,2.737 -11.894,7.596 -11.894,7.596Z"></path></svg>
                      Telegram : ducksmafiaxrd
                    </a>
                    </li>
                    <li>
                    <a href="https://linktr.ee/XRDDUCKM">
                      Linktree
                    </a>
                    </li>
                    <li>
                    <a href="https://docs.google.com/forms/d/e/1FAIpQLSdBt-titR9Rr6Nm4DDIt_U0RLM0t3KfAyZU6oHO-H4cDRnVWA/viewform">
                      JOIN US ?
                    </a>
                    </li>
                  </ul>
                </div>
                <div style="margin: 5px; text-align: center; font-weight: 800">
                  <p>
                    Tokenomics and usefull links
                  </p>
                </div>
                <div style="width: 80%; margin-right: 10%; margin-left: 10%">
                  <ul>
                    <li>
                    <a href="https://ociswap.com/ducks-mafia/">
                      Ociswap : ducks-mafia
                    </a>
                    </li>
                    <li>
                    <a href="https://dogecubex.live/chart?symbol=DUCKT">
                      DogeCubeX : Duckt
                    </a>
                    </li>
                    <li>
                    <a href="https://www.radixscan.io/token/sduckt_rr1q0xhy7auj82axetxv7lfnxhrl6c65nlkdpu84rs9zahsyv7sat">
                      Addresses holding staked Duckt (SDUCKT)
                    </a>
                    </li>
                    <li>
                    <a href="https://www.radixscan.io/token/duckt_rr1q0y5z9389mk45qfwmpgvd0rq6y6weaq45wwcm06nx9ysxekm2h">
                      Addresses holding Duckt (DUCKT)
                    </a>
                    </li>
                    <li>
                    <a href="https://www.radixscan.io/token/duckm_rr1qwzulexthnh3l9khmhj5qjcz6erjzlp4d9dqcqtg6fvq86eay7">
                      Pre-investor (DUCKM collection -> 500 sales)
                    </a>
                    </li>
                  </ul>
                </div>
                </div>
          </div>
        </div>
      </section>
    </div>
</div>

<style>
  .container {
  color: #333;
  margin: 0 auto;
  text-align: center;
}

.container h1 {
  font-weight: normal;
  letter-spacing: .125rem;
  text-transform: uppercase;
}

.container li {
  display: inline-block;
  font-size: 1.5em;
  list-style-type: none;
  padding: 1em;
  text-transform: uppercase;
}

.container li span {
  display: block;
  font-size: 4.5rem;
}

.container .emoji {
  display: none;
  padding: 1rem;
}

.container .emoji span {
  font-size: 4rem;
  padding: 0 .5rem;
}

@media all and (max-width: 768px) {
  h1 {
    font-size: calc(1.5rem * var(--smaller));
  }
  
  li {
    font-size: calc(1.125rem * var(--smaller));
  }
  
  li span {
    font-size: calc(3.375rem * var(--smaller));
  }
}

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
        min-height: 100%;
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