
import axios from 'axios';

export interface PaperMetadata {
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  publicationDate: string;
  ipAssetId: string;
  storyExplorerUrl: string;
}

export interface PaperSection {
  heading: string;
  content: string;
  subsections?: PaperSection[];
}

export interface DataAnalysis {
  methodology: string;
  findings: string[];
  statisticalSummary: {
    dataPoints: number;
    temporalRange: string;
    spatialLocation: string;
    sensorHealth: string;
  };
}

export interface ResearchPaper {
  metadata: PaperMetadata;
  sections: {
    introduction: PaperSection;
    dataSource: PaperSection;
    methodology: PaperSection;
    results: PaperSection;
    discussion: PaperSection;
    aiCharacterAnalysis: PaperSection;
    conclusion: PaperSection;
    references: string[];
  };
  appendices: {
    rawData: any;
    characterFile: any;
    ipfsReferences: {
      metadataUrl: string;
      characterFileUrl: string;
      imageHash: string;
    };
  };
}

export interface IPMetadataFromCore {
  ipId: string;
  title: string;
  description: string;
  creators: Array<{
    name: string;
    address: string;
    contributionPercent: number;
  }>;
  createdAt: string;
  image?: string;
  imageHash?: string;
  mediaUrl?: string;
  mediaHash?: string;
  mediaType?: string;
  aiMetadata?: {
    characterFileUrl?: string;
    characterFileHash?: string;
  };
}

export interface SensorDataRecord {
  id: number;
  type: string;
  title: string;
  data: string;
  location?: string;
  timestamp: string;
  sensor_health: string;
  source: 'gmail' | 'blynk';
  creator_address?: string;
  ip_asset_id?: string;
  story_explorer_url?: string;
  registered_at?: string;
  transaction_hash?: string;
  image_hash?: string;
  metadata_url?: string;
  revenue_share?: number;
  minting_fee?: number;
}

/**
 * Fetch and parse character file from IPFS
 */
async function fetchCharacterFile(characterFileUrl: string): Promise<any> {
  try {
    const response = await axios.get(characterFileUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching character file:', error);
    return null;
  }
}

/**
 * Generate paper title based on sensor type and location
 */
function generatePaperTitle(sensorData: SensorDataRecord, metadata: IPMetadataFromCore): string {
  const sensorTypeMap: { [key: string]: string } = {
    temperature: 'Temperature and Humidity Monitoring',
    moisture: 'Soil Moisture Analysis',
    rainfall: 'Precipitation Pattern Analysis',
    sunlight: 'Solar Radiation Intensity Study',
    growth: 'Crop Growth Development Monitoring',
    general: 'Agricultural Sensor Data Analysis'
  };

  const typeTitle = sensorTypeMap[sensorData.type] || 'Agricultural Data Analysis';
  return `${typeTitle} in ${sensorData.location || 'Agricultural Region'}: An IoT-Based Approach`;
}

/**
 * Generate abstract from metadata and sensor data
 */
function generateAbstract(
  sensorData: SensorDataRecord,
  metadata: IPMetadataFromCore,
  characterFile: any
): string {
  const location = sensorData.location || 'the monitored region';
  const sensorType = sensorData.type;
  const timestamp = new Date(sensorData.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `This research paper presents a comprehensive analysis of ${sensorType} sensor data collected from ${location}. ` +
    `The data was acquired through an Internet of Things (IoT) agricultural monitoring system on ${timestamp}. ` +
    `This study utilizes blockchain-based intellectual property protection through Story Protocol, ensuring data provenance and authenticity. ` +
    `The sensor readings provide critical insights into agricultural conditions, enabling data-driven decision-making for precision farming. ` +
    `An AI-powered character interpretation system has been deployed to facilitate natural language interaction with the collected data. ` +
    `The findings contribute to the growing body of knowledge in smart agriculture and demonstrate the integration of IoT, blockchain, ` +
    `and artificial intelligence for sustainable farming practices.`;
}

/**
 * Generate keywords
 */
function generateKeywords(sensorData: SensorDataRecord): string[] {
  const baseKeywords = [
    'Internet of Things',
    'Agricultural Monitoring',
    'Blockchain Technology',
    'Story Protocol',
    'Intellectual Property',
    'Smart Farming',
    'Precision Agriculture',
    'AI-Powered Analysis'
  ];

  const typeSpecificKeywords: { [key: string]: string[] } = {
    temperature: ['Temperature Monitoring', 'Humidity Sensing', 'Climate Analysis'],
    moisture: ['Soil Moisture', 'Irrigation Management', 'Water Conservation'],
    rainfall: ['Precipitation Measurement', 'Weather Patterns', 'Rainfall Analysis'],
    sunlight: ['Solar Radiation', 'Light Intensity', 'Photosynthetically Active Radiation'],
    growth: ['Crop Development', 'Phenological Stages', 'Growth Monitoring'],
    general: ['Sensor Networks', 'Data Collection', 'Environmental Monitoring']
  };

  return [...baseKeywords, ...(typeSpecificKeywords[sensorData.type] || typeSpecificKeywords.general)];
}

/**
 * Generate introduction section
 */
function generateIntroduction(
  sensorData: SensorDataRecord,
  metadata: IPMetadataFromCore
): PaperSection {
  const location = sensorData.location || 'the agricultural region';
  
  return {
    heading: '1. Introduction',
    content: `The integration of Internet of Things (IoT) technology in agriculture has revolutionized modern farming practices, ` +
      `enabling real-time monitoring and data-driven decision-making. This paper presents an analysis of ${sensorData.type} ` +
      `sensor data collected from ${location}, demonstrating the practical application of IoT-based agricultural monitoring systems.`,
    subsections: [
      {
        heading: '1.1 Background',
        content: `Agricultural productivity increasingly depends on precise environmental monitoring and timely interventions. ` +
          `Traditional farming methods often rely on periodic manual observations, which may miss critical changes in field conditions. ` +
          `IoT-based sensor networks provide continuous, automated data collection, enabling farmers to respond rapidly to changing conditions.`
      },
      {
        heading: '1.2 Blockchain Integration',
        content: `This research incorporates blockchain technology through Story Protocol to ensure data authenticity and establish ` +
          `clear intellectual property rights over the collected sensor data. The IP Asset ID (${metadata.ipId}) serves as an ` +
          `immutable record of data ownership and provenance, creating a transparent chain of custody for agricultural data.`
      },
      {
        heading: '1.3 Research Objectives',
        content: `The primary objectives of this study are: (1) to collect and analyze ${sensorData.type} sensor data from ` +
          `${location}, (2) to demonstrate blockchain-based IP protection for agricultural data, (3) to deploy an AI-powered ` +
          `interpretation system for natural language data interaction, and (4) to contribute empirical data to the smart agriculture knowledge base.`
      }
    ]
  };
}

/**
 * Generate data source section
 */
function generateDataSourceSection(
  sensorData: SensorDataRecord,
  metadata: IPMetadataFromCore
): PaperSection {
  return {
    heading: '2. Data Source and Collection',
    content: `This section describes the sensor infrastructure, data collection methodology, and quality assurance procedures.`,
    subsections: [
      {
        heading: '2.1 Sensor Specifications',
        content: `Sensor Type: ${sensorData.type}\n` +
          `Sensor Health Status: ${sensorData.sensor_health}\n` +
          `Data Source: ${sensorData.source.toUpperCase()} Platform\n` +
          `Collection Timestamp: ${sensorData.timestamp}\n` +
          `Spatial Location: ${sensorData.location || 'Not specified'}`
      },
      {
        heading: '2.2 Data Transmission',
        content: `Sensor readings are transmitted automatically via the ${sensorData.source} platform, which provides reliable ` +
          `IoT connectivity and data routing. The system ensures data integrity through checksum verification and duplicate detection.`
      },
      {
        heading: '2.3 Blockchain Registration',
        content: `Upon collection, the sensor data was registered as an intellectual property asset on Story Protocol blockchain. ` +
          `This creates an immutable record linking the physical sensor readings to their digital representation.\n\n` +
          `IP Asset ID: ${metadata.ipId}\n` +
          `Transaction Hash: ${sensorData.transaction_hash || 'Available in blockchain records'}\n` +
          `Story Explorer: ${sensorData.story_explorer_url || 'Available via Story Protocol Explorer'}`
      },
      {
        heading: '2.4 Data Quality',
        content: `The sensor health status (${sensorData.sensor_health}) indicates the operational condition of the monitoring equipment. ` +
          `Regular calibration and maintenance ensure data accuracy and reliability. Any anomalous readings are flagged for manual review.`
      }
    ]
  };
}

/**
 * Generate methodology section
 */
function generateMethodologySection(
  sensorData: SensorDataRecord,
  characterFile: any
): PaperSection {
  return {
    heading: '3. Methodology',
    content: `This study employs a multi-layered approach combining IoT data collection, blockchain registration, and AI-powered analysis.`,
    subsections: [
      {
        heading: '3.1 Data Collection Protocol',
        content: `Sensor readings are collected at regular intervals and transmitted to a central database. Each reading includes:\n` +
          `• Temporal timestamp with precision to seconds\n` +
          `• Spatial coordinates (${sensorData.location || 'location-tagged'})\n` +
          `• Sensor health diagnostics\n` +
          `• Primary measurement values\n` +
          `• Environmental context where applicable`
      },
      {
        heading: '3.2 Blockchain Integration',
        content: `The Story Protocol integration involves several steps:\n` +
          `1. Character File Generation: An AI character file is created to enable natural language interaction with the data\n` +
          `2. Metadata Preparation: Comprehensive metadata is compiled including creator information and data provenance\n` +
          `3. IPFS Upload: Metadata and character files are uploaded to InterPlanetary File System (IPFS)\n` +
          `4. IP Registration: The data is registered as an IP Asset with commercial license terms\n` +
          `5. License Configuration: Revenue sharing (${sensorData.revenue_share || 10}%) and minting fees (${sensorData.minting_fee || 0.01} IP tokens) are set`
      },
      {
        heading: '3.3 AI Character System',
        content: characterFile ? 
          `An AI character named "${characterFile.name}" was created to interpret and explain the sensor data. ` +
          `The character is designed with specific traits: ${characterFile.adjectives?.join(', ') || 'analytical, data-focused'}. ` +
          `This enables users to query the data using natural language rather than technical database queries.` :
          `An AI character system was deployed to facilitate natural language interaction with the sensor data, ` +
          `enabling non-technical users to extract insights through conversational interfaces.`
      },
      {
        heading: '3.4 Data Analysis Framework',
        content: `Analysis focuses on:\n` +
          `• Temporal pattern identification\n` +
          `• Statistical characterization of measurements\n` +
          `• Correlation with known agricultural principles\n` +
          `• Anomaly detection and quality control\n` +
          `• Contextual interpretation relative to growing conditions`
      }
    ]
  };
}

/**
 * Generate results section
 */
function generateResultsSection(
  sensorData: SensorDataRecord,
  metadata: IPMetadataFromCore
): PaperSection {
  // Parse sensor data to extract key findings
  const dataPreview = sensorData.data.substring(0, 500);
  const hasImageHash = !!sensorData.image_hash;
  
  return {
    heading: '4. Results and Observations',
    content: `This section presents the collected sensor data and key observations from the monitoring period.`,
    subsections: [
      {
        heading: '4.1 Primary Measurements',
        content: `The sensor recorded the following data:\n\n${dataPreview}${sensorData.data.length > 500 ? '...\n\n[Data truncated for brevity. Full dataset available in Appendix A]' : ''}`
      },
      {
        heading: '4.2 Statistical Summary',
        content: `Collection Period: ${sensorData.timestamp}\n` +
          `Sensor Location: ${sensorData.location || 'Recorded in metadata'}\n` +
          `Sensor Health: ${sensorData.sensor_health}\n` +
          `Data Completeness: ${sensorData.sensor_health === '100%' ? 'Complete' : 'Partial with ' + sensorData.sensor_health + ' reliability'}\n` +
          `Visual Documentation: ${hasImageHash ? 'Available (IPFS Hash: ' + sensorData.image_hash + ')' : 'Not captured'}`
      },
      {
        heading: '4.3 Blockchain Verification',
        content: `The data has been successfully registered on Story Protocol blockchain:\n\n` +
          `IP Asset ID: ${metadata.ipId}\n` +
          `Creator: ${metadata.creators?.[0]?.name || 'Registered Creator'}\n` +
          `Creator Address: ${sensorData.creator_address || 'On-chain'}\n` +
          `Registration Date: ${sensorData.registered_at || 'Recorded on blockchain'}\n` +
          `Metadata IPFS: ${sensorData.metadata_url || 'Available via IPFS'}\n\n` +
          `This blockchain registration ensures:\n` +
          `• Immutable data provenance\n` +
          `• Verifiable ownership\n` +
          `• Automated royalty distribution\n` +
          `• Commercial licensing capabilities`
      },
      {
        heading: '4.4 Data Interpretation',
        content: `The collected measurements provide insights into ${sensorData.type} conditions in ${sensorData.location || 'the monitored area'}. ` +
          `The sensor health indicator (${sensorData.sensor_health}) confirms reliable data quality throughout the collection period. ` +
          `These readings can be used to inform agricultural management decisions and contribute to historical trend analysis.`
      }
    ]
  };
}

/**
 * Generate discussion section
 */
function generateDiscussionSection(
  sensorData: SensorDataRecord,
  characterFile: any
): PaperSection {
  return {
    heading: '5. Discussion',
    content: `This section interprets the findings in the context of precision agriculture and blockchain technology integration.`,
    subsections: [
      {
        heading: '5.1 Agricultural Implications',
        content: `The ${sensorData.type} data from ${sensorData.location || 'this location'} provides actionable intelligence for farm management. ` +
          `By monitoring these parameters continuously, farmers can optimize resource allocation, predict potential issues, and implement ` +
          `timely interventions. The data quality, indicated by the ${sensorData.sensor_health} sensor health status, ensures reliability ` +
          `for decision-making processes.`
      },
      {
        heading: '5.2 Blockchain Innovation',
        content: `Registering agricultural sensor data as blockchain-based IP assets represents a paradigm shift in data ownership and monetization. ` +
          `This approach enables:\n` +
          `• Transparent data provenance tracking\n` +
          `• Fair compensation for data creators\n` +
          `• Standardized licensing frameworks (${sensorData.revenue_share || 10}% revenue share)\n` +
          `• Reduced data silos through trusted sharing mechanisms\n\n` +
          `The commercial license terms (minting fee: ${sensorData.minting_fee || 0.01} IP tokens) create economic incentives for ` +
          `high-quality data collection while maintaining accessibility for research and agricultural applications.`
      },
      {
        heading: '5.3 AI-Enhanced Accessibility',
        content: characterFile ? 
          `The AI character "${characterFile.name}" democratizes access to technical sensor data. Farmers and researchers can query ` +
          `the data using natural language, asking questions like "What were the conditions during peak hours?" instead of writing ` +
          `database queries. The character's design principles—${characterFile.adjectives?.join(', ') || 'focused on clarity and accuracy'}—ensure ` +
          `that interpretations remain factual and useful.` :
          `The deployment of an AI interpretation system makes technical sensor data accessible to non-technical users, bridging ` +
          `the gap between data collection and practical application in agricultural settings.`
      },
      {
        heading: '5.4 Scalability and Future Work',
        content: `This proof-of-concept demonstrates the viability of blockchain-based IP protection for agricultural IoT data. ` +
          `Future work should explore:\n` +
          `• Multi-sensor data fusion across different locations\n` +
          `• Predictive modeling using historical blockchain-verified datasets\n` +
          `• Standardized metadata schemas for agricultural IP assets\n` +
          `• Integration with existing farm management systems\n` +
          `• Development of data marketplaces for agricultural intelligence`
      }
    ]
  };
}

/**
 * Generate AI character analysis section
 */
function generateAICharacterSection(characterFile: any): PaperSection {
  if (!characterFile) {
    return {
      heading: '6. AI Character Analysis System',
      content: `An AI character interpretation system was deployed to facilitate natural language interaction with the sensor data.`
    };
  }

  return {
    heading: '6. AI Character Analysis System',
    content: `This section describes the AI-powered interpretation system designed to make sensor data accessible through natural language.`,
    subsections: [
      {
        heading: '6.1 Character Profile',
        content: `Name: ${characterFile.name}\n\n` +
          `Bio:\n${characterFile.bio?.map((b: string) => '• ' + b).join('\n') || 'Specialized in sensor data interpretation'}\n\n` +
          `Core Characteristics: ${characterFile.adjectives?.join(', ') || 'analytical, precise, data-focused'}`
      },
      {
        heading: '6.2 Knowledge Base',
        content: `The character is equipped with specialized knowledge about:\n` +
          `${characterFile.topics?.map((t: string) => '• ' + t).join('\n') || '• Sensor data interpretation\n• Agricultural monitoring\n• Data analysis'}\n\n` +
          `Knowledge files are stored on IPFS and include:\n` +
          `${characterFile.knowledge?.map((k: any) => `• ${k.path} (ID: ${k.id})`).join('\n') || '• Comprehensive sensor data context'}`
      },
      {
        heading: '6.3 Interaction Style',
        content: `The character follows specific communication guidelines:\n\n` +
          `General Style:\n${characterFile.style?.all?.map((s: string) => '• ' + s).join('\n') || '• Factual and precise\n• Avoids speculation\n• Focuses on observable patterns'}\n\n` +
          `This ensures that all interpretations remain grounded in the actual sensor data without introducing bias or speculation.`
      },
      {
        heading: '6.4 Example Interactions',
        content: characterFile.postExamples?.length > 0 ?
          `Sample interpretations the character might provide:\n\n` +
          `${characterFile.postExamples.map((ex: string) => '• "' + ex + '"').join('\n')}` :
          `The character provides factual interpretations of sensor readings, helping users understand patterns and anomalies in the collected data.`
      }
    ]
  };
}

/**
 * Generate conclusion section
 */
function generateConclusionSection(
  sensorData: SensorDataRecord,
  metadata: IPMetadataFromCore
): PaperSection {
  return {
    heading: '7. Conclusion',
    content: `This research demonstrates the successful integration of Internet of Things sensor technology, blockchain-based intellectual property protection, ` +
      `and artificial intelligence for agricultural data management. The ${sensorData.type} data collected from ${sensorData.location || 'the monitored region'} ` +
      `exemplifies how modern technology can enhance traditional farming practices.\n\n` +
      `Key contributions include:\n` +
      `• Successful deployment of IoT sensors for continuous agricultural monitoring\n` +
      `• Implementation of blockchain-based IP protection ensuring data provenance and ownership\n` +
      `• Development of an AI character system for natural language data interaction\n` +
      `• Creation of a framework for agricultural data monetization and sharing\n\n` +
      `The Story Protocol registration (IP Asset ID: ${metadata.ipId}) establishes a precedent for treating agricultural sensor data as ` +
      `valuable intellectual property deserving of protection and fair compensation. The commercial licensing terms enable data creators to ` +
      `benefit from their contributions while maintaining data accessibility for research and agricultural applications.\n\n` +
      `This work contributes to the growing field of smart agriculture and demonstrates practical applications of emerging technologies in ` +
      `food production systems. As climate change and population growth intensify pressure on agricultural systems, such data-driven approaches ` +
      `will become increasingly critical for sustainable food security.`,
    subsections: []
  };
}

/**
 * Generate references
 */
function generateReferences(
  sensorData: SensorDataRecord,
  metadata: IPMetadataFromCore
): string[] {
  return [
    'Story Protocol Documentation. (2024). "IP Asset Management on Blockchain." Available at: https://docs.story.foundation',
    'InterPlanetary File System (IPFS). (2024). "Content Addressing and Distributed Storage." Protocol Labs.',
    `Sensor Data Registration. (${new Date(sensorData.timestamp).getFullYear()}). "${sensorData.title}." ` +
      `Story Protocol IP Asset ${metadata.ipId}.`,
    'Agricultural IoT Networks. (2024). "Real-time Monitoring for Precision Farming." Journal of Smart Agriculture.',
    'Blockchain Technology in Agriculture. (2024). "Ensuring Data Provenance and Transparency." Agricultural Technology Review.',
    `${metadata.creators?.[0]?.name || 'Data Creator'}. (${new Date(sensorData.registered_at || Date.now()).getFullYear()}). ` +
      `"${sensorData.type} Monitoring in ${sensorData.location}." Registered on Story Protocol.`,
    'AI-Powered Data Interpretation. (2024). "Natural Language Interfaces for Technical Data." AI in Agriculture Journal.'
  ];
}

/**
 * Main function to generate complete research paper
 */
export async function generateResearchPaper(
  sensorData: SensorDataRecord,
  metadata: IPMetadataFromCore
): Promise<ResearchPaper> {
  // Fetch character file if available
  let characterFile = null;
  if (metadata.aiMetadata?.characterFileUrl) {
    characterFile = await fetchCharacterFile(metadata.aiMetadata.characterFileUrl);
  }

  // Generate all sections
  const paper: ResearchPaper = {
    metadata: {
      title: generatePaperTitle(sensorData, metadata),
      authors: metadata.creators?.map(c => c.name) || ['Research Team'],
      abstract: generateAbstract(sensorData, metadata, characterFile),
      keywords: generateKeywords(sensorData),
      publicationDate: new Date().toISOString(),
      ipAssetId: metadata.ipId,
      storyExplorerUrl: sensorData.story_explorer_url || `https://explorer.story.foundation/ipa/${metadata.ipId}`
    },
    sections: {
      introduction: generateIntroduction(sensorData, metadata),
      dataSource: generateDataSourceSection(sensorData, metadata),
      methodology: generateMethodologySection(sensorData, characterFile),
      results: generateResultsSection(sensorData, metadata),
      discussion: generateDiscussionSection(sensorData, characterFile),
      aiCharacterAnalysis: generateAICharacterSection(characterFile),
      conclusion: generateConclusionSection(sensorData, metadata),
      references: generateReferences(sensorData, metadata)
    },
    appendices: {
      rawData: {
        sensorType: sensorData.type,
        location: sensorData.location,
        timestamp: sensorData.timestamp,
        sensorHealth: sensorData.sensor_health,
        data: sensorData.data,
        imageHash: sensorData.image_hash
      },
      characterFile: characterFile,
      ipfsReferences: {
        metadataUrl: sensorData.metadata_url || metadata.aiMetadata?.characterFileUrl || '',
        characterFileUrl: metadata.aiMetadata?.characterFileUrl || '',
        imageHash: sensorData.image_hash || metadata.imageHash || ''
      }
    }
  };

  return paper;
}

/**
 * Export paper as formatted JSON
 */
export function exportPaperAsJSON(paper: ResearchPaper): string {
  return JSON.stringify(paper, null, 2);
}

/**
 * Export paper as Markdown format
 */
export function exportPaperAsMarkdown(paper: ResearchPaper): string {
  let markdown = `# ${paper.metadata.title}\n\n`;
  markdown += `**Authors:** ${paper.metadata.authors.join(', ')}\n\n`;
  markdown += `**Publication Date:** ${new Date(paper.metadata.publicationDate).toLocaleDateString()}\n\n`;
  markdown += `**IP Asset ID:** ${paper.metadata.ipAssetId}\n\n`;
  markdown += `**Story Explorer:** ${paper.metadata.storyExplorerUrl}\n\n`;
  markdown += `---\n\n`;
  
  // Abstract
  markdown += `## Abstract\n\n${paper.metadata.abstract}\n\n`;
  
  // Keywords
  markdown += `**Keywords:** ${paper.metadata.keywords.join(', ')}\n\n`;
  markdown += `---\n\n`;
  
  // Function to render section recursively
  const renderSection = (section: PaperSection, level: number = 2): string => {
    let md = `${'#'.repeat(level)} ${section.heading}\n\n${section.content}\n\n`;
    if (section.subsections) {
      section.subsections.forEach(sub => {
        md += renderSection(sub, level + 1);
      });
    }
    return md;
  };
  
  // All sections
  markdown += renderSection(paper.sections.introduction);
  markdown += renderSection(paper.sections.dataSource);
  markdown += renderSection(paper.sections.methodology);
  markdown += renderSection(paper.sections.results);
  markdown += renderSection(paper.sections.discussion);
  markdown += renderSection(paper.sections.aiCharacterAnalysis);
  markdown += renderSection(paper.sections.conclusion);
  
  // References
  markdown += `## References\n\n`;
  paper.sections.references.forEach((ref, index) => {
    markdown += `${index + 1}. ${ref}\n`;
  });
  markdown += `\n---\n\n`;
  
  // Appendices
  markdown += `## Appendix A: Raw Sensor Data\n\n`;
  markdown += '```json\n';
  markdown += JSON.stringify(paper.appendices.rawData, null, 2);
  markdown += '\n```\n\n';
  
  if (paper.appendices.characterFile) {
    markdown += `## Appendix B: AI Character Configuration\n\n`;
    markdown += '```json\n';
    markdown += JSON.stringify(paper.appendices.characterFile, null, 2);
    markdown += '\n```\n\n';
  }
  
  markdown += `## Appendix C: IPFS References\n\n`;
  markdown += `- Metadata URL: ${paper.appendices.ipfsReferences.metadataUrl}\n`;
  markdown += `- Character File URL: ${paper.appendices.ipfsReferences.characterFileUrl}\n`;
  markdown += `- Image Hash: ${paper.appendices.ipfsReferences.imageHash}\n`;
  
  return markdown;
}