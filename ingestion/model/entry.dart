class DictionaryEntry {
  final String id;
  final Set<String> variants;
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
        'variants': variants.toList(),
        'partOfSpeech': partOfSpeech,
        'entry': entry,
      };
}
