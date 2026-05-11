// Dynamic import used inside the function — see generatePdf() — to prevent
// @react-pdf/renderer from being included in the SSR bundle.
import type { ParsedResume } from "./resumeParser";

export async function generatePdf(parsed: ParsedResume): Promise<Blob> {
  const { Document, Page, Text, View, StyleSheet, pdf } = await import(
    "@react-pdf/renderer"
  );
  const { default: React } = await import("react");

  const styles = StyleSheet.create({
    page: { padding: 36, fontSize: 11, fontFamily: "Helvetica" },
    name: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 4,
    },
    contact: {
      fontSize: 10,
      textAlign: "center",
      color: "#555555",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "bold",
      marginTop: 12,
      marginBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      paddingBottom: 2,
    },
    heading: {
      fontSize: 11,
      fontWeight: "bold",
      marginTop: 6,
      marginBottom: 2,
    },
    subheading: {
      fontSize: 10,
      fontStyle: "italic",
      color: "#444444",
      marginBottom: 4,
    },
    bullet: { fontSize: 11, marginLeft: 12, marginBottom: 2 },
    body: { fontSize: 11, marginBottom: 4 },
  });

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      parsed.name
        ? React.createElement(Text, { style: styles.name }, parsed.name)
        : null,
      parsed.contact
        ? React.createElement(Text, { style: styles.contact }, parsed.contact)
        : null,
      ...parsed.sections.map((section, i) =>
        React.createElement(
          View,
          { key: String(i) },
          React.createElement(
            Text,
            { style: styles.sectionTitle },
            section.title
          ),
          ...section.entries.map((entry, j) =>
            React.createElement(
              View,
              { key: String(j) },
              entry.heading
                ? React.createElement(
                    Text,
                    { style: styles.heading },
                    entry.heading
                  )
                : null,
              entry.subheading
                ? React.createElement(
                    Text,
                    { style: styles.subheading },
                    entry.subheading
                  )
                : null,
              ...entry.bullets.map((b, k) =>
                React.createElement(
                  Text,
                  { key: String(k), style: styles.bullet },
                  `• ${b}`
                )
              ),
              entry.body
                ? React.createElement(
                    Text,
                    { style: styles.body },
                    entry.body
                  )
                : null
            )
          )
        )
      )
    )
  );

  return await pdf(doc).toBlob();
}
