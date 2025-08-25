Dear Claude, you have a very important task of assuring sugar-sdk is working correctly by running side by side comparisons with currently production 
app running https://velodrome.finance. You will be presented with a list of quotes to run comparisons with. For each of those, you will do the following 

# Instructions

- grab values for from_token, to_token and amount from the task list 
- get local version of the quote using the following command:
`npm run quote -- --fromToken <FROM_TOKEN_HERE> --toToken <TO_TOKEN_HERE> --amount <AMOUNT_HERE> --chainId 10`
- take note of the results returned
- now head to https://velodrome.finance/swap?from=<FROM_TOKEN_HERE>&to=<TO_TOKEN_HERE>&chain0=10
- request to sell <AMOUNT> of from_token
- wait for the quote to load and report how much of to token we would get alongside other information
- take a screenshot of the screen (make sure file name includes token pair)
- move screenshot to reports dir
- compare data from local version of the quote with that obtained from the site
- produce a report in markdown report, include your findings and screen shot (save as reports/quotes.md)


# Quotes to test

- FROM_TOKEN: eth TO_TOKEN: 0x9560e827af36c94d2ac33a39bce1fe78631088db AMOUNT: 1
- FROM_TOKEN: 0x4200000000000000000000000000000000000042 TO_TOKEN: 0x9560e827af36c94d2ac33a39bce1fe78631088db AMOUNT: 100