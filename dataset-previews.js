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
    fast: {
        title: 'Clean Topic Dataset',
        source: 'dataset/clean_dataset.csv',
        note: 'Original 3-column dataset with Tagalog, English, and Cebuano text used for topic-modeling previews.'
    },
    language: {
        title: 'Language Detection Dataset',
        source: 'dataset/language_detection_dataset.csv',
        note: 'Long-format dataset used by the TF-IDF + Logistic Regression language detector.',
        alternateDatasetKey: 'original',
        alternateButtonLabel: 'View Original 3-Column Dataset'
    },
    original: {
        title: 'Original 3-Column Dataset',
        source: 'dataset/clean_dataset.csv',
        note: 'Original cleaned dataset with Tagalog, English, and Cebuano columns.',
        alternateDatasetKey: 'language',
        alternateButtonLabel: 'View Melted Language Dataset'
    }
};
