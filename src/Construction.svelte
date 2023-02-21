<script>
    import App from "./App.svelte";
</script>

<div style="background-color: white;">
    <div class="content">
        <section>
            <div class="col-100"><div class="square col-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 1"/>
              <div class="mask">
              </div><div class="inbox">
                <div class="intInbox flexBox">
                  <img width="20px" style="display: block;width: 30%;margin: auto;margin-top: 35px" src="underconstruction.png" alt="duckt logo"/>
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