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
-h help

#Dependency : nodes version > 12.0 (Find commands to install nodejs 12 in ubuntu in nodejs.sh)
