export const agendaSchemaDescription = `Return STRICT JSON ONLY. Use this schema:
{
  "conference": {
    "name": string,
    "acronym": string | null,
    "organizer": string | null,
    "website": string | null,
    "location": {
      "city": string | null,
      "state": string | null,
      "country": string | null,
      "venue": string | null,
      "address": string | null
    },
    "dates": {
      "start": string | null,
      "end": string | null,
      "timezone": string | null
    }
  },
  "tracks": [
    {
      "name": string,
      "description": string | null,
      "keywords": string[]
    }
  ],
  "sessions": [
    {
      "id": string,
      "title": string,
      "type": string | null,
      "track": string | null,
      "abstract": string | null,
      "date": string | null,
      "startTime": string | null,
      "endTime": string | null,
      "location": string | null,
      "speakers": [string],
      "moderators": [string],
      "topics": [string]
    }
  ],
  "speakers": [
    {
      "name": string,
      "role": string | null,
      "affiliation": string | null,
      "bio": string | null,
      "sessions": [string],
      "topics": [string]
    }
  ],
  "sponsors": [
    {
      "name": string,
      "tier": string | null,
      "url": string | null
    }
  ],
  "themes": [string],
  "keywords": [string],
  "highlights": [string],
  "data_quality": {
    "missing_fields": [string],
    "assumptions": [string]
  }
}
Rules:
- Use null when unknown.
- Do not invent details.
- Arrays can be empty.
- ids must be stable strings; if no id, use slug from title + date.
`;
