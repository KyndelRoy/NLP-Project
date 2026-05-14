window.DATASET_PREVIEWS = {
    bart: {
        title: 'BART-Large-MNLI Dataset',
        source: 'Pretrained model + candidate labels',
        note: 'BART-Large-MNLI is used as a pretrained zero-shot classifier. This app does not train it on a local CSV dataset.'
    },
    specialized: {
        title: 'Clean Topic Dataset',
        source: 'dataset/clean_dataset.csv',
        note: 'Original 3-column dataset with Tagalog, English, and Cebuano text used for topic-modeling previews.'
    },
    bertopic_en: {
        title: 'BERTopic English Dataset',
        source: 'bertopic_classifier/bertopic_dataset.csv',
        note: 'Parallel trilingual dataset — English column used for training.'
    },
    bertopic_en_tl: {
        title: 'BERTopic EN + TL Dataset',
        source: 'bertopic_classifier/bertopic_dataset.csv',
        note: 'Parallel trilingual dataset — English and Tagalog columns concatenated for training.'
    },
    bertopic_tri: {
        title: 'BERTopic Trilingual Dataset',
        source: 'bertopic_classifier/bertopic_dataset.csv',
        note: 'Parallel trilingual dataset — all three columns concatenated for training.'
    },
    language: {
        title: 'Language Detection Dataset',
        source: 'dataset/language_detection_dataset.csv',
        note: 'Long-format dataset used by the TF-IDF + Logistic Regression language detector.',
        alternateDatasetKey: 'original',
        alternateButtonLabel: 'View Original 3-Column Dataset'
    },
    original: {
        title: 'Original Language Dataset',
        source: 'dataset/original_dataset.csv',
        note: 'Original dataset used as the source for the melted language detection dataset.',
        alternateDatasetKey: 'language',
        alternateButtonLabel: 'View Melted Language Dataset'
    }
};
