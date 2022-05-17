# mediarecwarmer
utility to warm Regional Edge Cache in the region


command to run utility :  
git clone https://github.com/ggn/mediarecwarmer.git   
cd mediarecwarmer  
npm install  
node app.js -u {{YOUR_URL}} -b {{PREFFRED_BATCH_SIZE}} -l {{true or false}}  

-u is mandatory.   
-b is optional, default 10.   
-l is optional, default false. 
-0 is optional, default is null. 
-h help, run this for detailed explanation of each parameter.

Sample Command for reference:
node app.js -u "https://d7s5c9d8u64h8.cloudfront.net/public_data/cps_demo/outputs/1/1.Login.m3u8" -b 50 -l true -o "sampleOptions.json"

#Dependency : nodes version > 12.0 (Find commands to install nodejs 12 in ubuntu in nodejs.sh)
