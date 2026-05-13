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
        title: 'Original Language Dataset',
        source: 'dataset/original_dataset.csv',
        note: 'Original dataset used as the source for the melted language detection dataset.',
        alternateDatasetKey: 'language',
        alternateButtonLabel: 'View Melted Language Dataset'
    }
};
