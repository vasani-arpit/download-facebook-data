# Download Facebook data

## 🤷‍♂️ What is this?

This code will download **all the photos from a profile**. The easy and best way to download all your facebook photos is [this one](https://www.alphr.com/download-all-photos-facebook/). In my case I was not able to login into the account which I wanted to download photos from 😉 so I createed this script. 

## 🚀 How to run this?

1. Clone the repo
2. `npm install`
3. Run chrome with remote debugging port 
    - for windows, close all chrome instances including PWAs
    - chrome icon on desktop > properties > target, add this at the end ` --remote-debugging-port=9222 -- "%1"`
    - save and start chrome
4. go to VSCode and hit F5
5. Once building is complete it will open facebook in your browser
6. login if you aren't in FB 
7. Go to any profile by searching or from your friend list
8. Goto Photos > Albums 
9. Script will detect that you are on Albums page so it will open first album in new tab
10. if there are more than 100 images then you need to scroll until all images are loaded, script will detect once all (or enough) are loaded then it will do it's thing
11. If there are less images in album and all are loaded in the page then script will start doing it's thing without waiting for you to scroll


## 💁‍♂️ How is this working?

It connects to your running chrome instead of creating a new instance of the chrome which Facebook might detect and block. and believe me they are good at detecting automation activity. 

For simplicity, script is running in synchronous mode, It can be made faster but I don't see the reason to. 

## 🛑 General Warning

This repo is for eduction purpose only. This may or may not work. If Facebook or local authority stop or ban you account then it's on you. 