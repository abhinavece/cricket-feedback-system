/**
 * Component to inject JSON-LD structured data into pages
 */

interface SchemaScriptProps {
  schema: Record<string, unknown> | Record<string, unknown>[];
}

export default function SchemaScript({ schema }: SchemaScriptProps) {
  const schemaString = JSON.stringify(Array.isArray(schema) ? schema : [schema]);
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: schemaString }}
    />
  );
}
