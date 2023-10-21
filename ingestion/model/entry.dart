class DictionaryEntry {
  final String id;
  final List<String> variants;
  final String? partOfSpeech;
  final String entry;

  const DictionaryEntry({
    required this.id,
    required this.variants,
    required this.partOfSpeech,
    required this.entry,
  });

  Map<String, dynamic> toJson([bool includeId = false]) => {
        if (includeId) 'id': id,
        'variants': variants,
        'partOfSpeech': partOfSpeech,
        'entry': entry,
      };
}
