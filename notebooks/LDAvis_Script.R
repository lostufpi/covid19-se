## Imports
library(mallet)
library(LDAvis)
library(jsonlite)
library(gistr)

## Paths: root path, stop words and datasets
rootPath      <- ""
stopWordsPath <- ""
platformPath  <- ""
frameworkPath <- ""

executeLDA <- function(nTopics, dataFilePath, pclass){
    outputDirPath <- paste(rootPath, "/", pclass, "/lda_", nTopics, sep = "")
    ## Create a wrapper for the data with three elements, one for each column.
    ## Note that "id" and "text" are special fields -- mallet will look there for input.
    documents <- read.table(dataFilePath, col.names = c("id", "text"), sep = ",", quote = "", stringsAsFactors = FALSE)

    ## Create a mallet instance list object. Right now I have to specify the stoplist
    ## Original regex: \\p{L}[\\p{L}\\p{P}]+\\p{L}
    ## Other options: \\p{L}[\\p{L}\\p{P}]* or [\\p{L}\\p{P}]+
    mallet.instances <- mallet.import(documents$id, documents$text, stopWordsPath, token.regexp = "\\p{L}[\\p{L}\\p{P}]+\\p{L}")

    ## Create a topic trainer object.
    topic.model <- MalletLDA(num.topics = nTopics)

    ## Load our documents.    
    topic.model$loadDocuments(mallet.instances)

    ## Get the vocabulary, and some statistics about word frequencies.
    ## These may be useful in further curating the stopword list.
    vocabulary <- topic.model$getVocabulary()
    word.freqs <- mallet.word.freqs(topic.model)

    ## Optimize hyperparameters every 10 iterations, after 20 burn-in iterations.
    topic.model$setAlphaOptimization(10, 20)

    ## Now train a model. Note that hyperparameter optimization is on, by default.
    topic.model$train(500)

    ## Run through a few iterations where we pick the best topic for each token
    topic.model$maximize(10)

    ## Get the probability of topics in documents and the probability of words in topics.
    ## By default, these functions return raw word counts. Here we want probabilities,
    ## so we normalize, and add "smoothing" so that nothing has exactly 0 probability.
    doc.topics <- mallet.doc.topics(topic.model, smoothed=T, normalized=T)
    topic.words <- mallet.topic.words(topic.model, smoothed=T, normalized=T)

    ## Creating JSON LDA to use in LDAVis
    phi <- mallet::mallet.topic.words(topic.model, smoothed = TRUE, normalized = TRUE)
    theta <- mallet::mallet.doc.topics(topic.model, smoothed = TRUE, normalized = TRUE)	
    doc.length <- rowSums(mallet::mallet.doc.topics(topic.model, smoothed = FALSE, normalized = FALSE))
    word.freqs <- mallet::mallet.word.freqs(topic.model)
    vocab <- topic.model$getVocabulary()
    json <- list(phi = phi, theta = theta, doc.length = doc.length, vocab = vocab, term.frequency = droplevels(word.freqs)$term.freq)
    jsonLDA <- LDAvis::createJSON(phi = json$phi, theta = json$theta, doc.length = json$doc.length, vocab = json$vocab, term.frequency = json$term.frequency)

    ## see help("serVis") for more details
    LDAvis::serVis(jsonLDA, out.dir = outputDirPath, open.browser = FALSE, as.gist = FALSE)
    ## topic.labels <- mallet.topic.labels(topic.model, topic.words, 3)

    file.copy(paste(outputDirPath, "/lda.json", sep = ""), paste(rootPath, "/jsons/", sep = ""))
    file.rename(paste(rootPath, "/jsons/", "lda.json", sep = ""), paste(rootPath, "/jsons/", "lda_", pclass, "_", nTopics,".json", sep = ""))
}

createModels <- function(){
    executeLDA(3, frameworkPath, "framework")
    executeLDA(3, platformPath, "platform")
}

## Run it!
createModels()
## End(Not run)