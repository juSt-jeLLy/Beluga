

import { Address } from 'viem';

export interface DerivativeMetadataParams {
  originalTitle: string;
  sensorType: string;
  location: string;
  timestamp: string;
  sensorHealth: string;
  parentIpId: Address;
  rawData?: string;
  creatorName?: string;
  creatorAddress?: Address;
  parentCreatorAddress?: Address;
  imageHash?: string;
  dataSource?: 'gmail' | 'blynk';
  registrationDate?: string;
}

export interface DerivativeIPMetadata {
  title: string;
  description: string;
}

export interface DerivativeNFTMetadata {
  name: string;
  description: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

/**
 * Generate human-readable sensor type name
 */
export function getSensorTypeDisplayName(sensorType: string): string {
  const typeMap: { [key: string]: string } = {
    'temperature': 'Temperature & Humidity',
    'temp': 'Temperature & Humidity',
    'moisture': 'Soil Moisture',
    'soil': 'Soil Moisture',
    'rainfall': 'Rainfall & Precipitation',
    'rain': 'Rainfall & Precipitation',
    'sunlight': 'Solar Radiation & Light Intensity',
    'sun': 'Solar Radiation & Light Intensity',
    'growth': 'Crop Growth & Development',
    'crop': 'Crop Growth & Development',
  };
  
  return typeMap[sensorType.toLowerCase()] || sensorType;
}

/**
 * Extract key insights from raw sensor data for AI readability
 */
export function extractDataInsights(rawData: string, sensorType: string): string {
  // Parse numeric values from the data
  const numbers = rawData.match(/\d+\.?\d*/g) || [];
  const hasMultipleReadings = numbers.length > 1;
  
  const insights: string[] = [];
  
  if (hasMultipleReadings) {
    insights.push(`Contains ${numbers.length} data points`);
  }
  
  // Type-specific insights
  const typeLower = sensorType.toLowerCase();
  if (typeLower.includes('temp')) {
    insights.push('Includes temperature and humidity measurements');
  } else if (typeLower.includes('moisture') || typeLower.includes('soil')) {
    insights.push('Includes soil moisture levels and irrigation data');
  } else if (typeLower.includes('rain')) {
    insights.push('Includes precipitation measurements and weather patterns');
  } else if (typeLower.includes('sun') || typeLower.includes('light')) {
    insights.push('Includes solar radiation and light intensity data');
  } else if (typeLower.includes('growth') || typeLower.includes('crop')) {
    insights.push('Includes crop development and phenological stage data');
  }
  
  return insights.join('. ') + '.';
}

/**
 * Generate derivative IP title with enhanced context
 */
export function generateDerivativeTitle(
  originalTitle: string, 
  sensorType: string,
  location: string
): string {
  const displayType = getSensorTypeDisplayName(sensorType);
  
  // Create a more descriptive title
  const titleLowerCase = originalTitle.toLowerCase();
  const typeLowerCase = sensorType.toLowerCase();
  
  // Check if location is already in the title
  const hasLocation = location && titleLowerCase.includes(location.toLowerCase().split(',')[0]);
  
  if (titleLowerCase.includes(typeLowerCase) && hasLocation) {
    return `Derivative AI Analysis: ${originalTitle}`;
  } else if (titleLowerCase.includes(typeLowerCase)) {
    return `Derivative AI Analysis: ${displayType} - ${location}`;
  } else {
    return `Derivative AI Analysis: ${displayType} from ${location}`;
  }
}

/**
 * Generate comprehensive derivative IP description with all parent data
 */
export function generateDerivativeDescription(params: DerivativeMetadataParams): string {
  const { 
    sensorType, 
    location, 
    timestamp, 
    parentIpId, 
    rawData,
    sensorHealth,
    dataSource,
    creatorName,
    parentCreatorAddress
  } = params;
  
  const displayType = getSensorTypeDisplayName(sensorType);
  
  const formattedDate = new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  const parentIpShort = `${parentIpId.slice(0, 10)}...${parentIpId.slice(-8)}`;
  
  // Build comprehensive description
  let description = `## Derivative Agricultural Data Analysis

This derivative IP asset contains comprehensive AI-generated research documentation and analysis for **${displayType}** sensor data.

### Source Information
- **Original Data Collection**: ${formattedDate}
- **Location**: ${location}
- **Sensor Type**: ${displayType}
- **Sensor Health Status**: ${sensorHealth}
- **Data Source**: ${dataSource ? dataSource.toUpperCase() : 'IoT Network'}
- **Parent IP Asset**: ${parentIpShort}
- **Full Parent IP ID**: ${parentIpId}`;

  if (parentCreatorAddress) {
    description += `
- **Original Creator Address**: ${parentCreatorAddress}`;
  }

  if (creatorName) {
    description += `
- **Derivative Creator**: ${creatorName}`;
  }

  // Add complete raw sensor data
  if (rawData) {
    const insights = extractDataInsights(rawData, sensorType);
    description += `

### Data Characteristics
${insights}

### Complete Sensor Data (Preserved from Parent IP)
\`\`\`
${rawData}
\`\`\`

**Data Integrity**: All original sensor readings are preserved exactly as recorded in the parent IP asset. No data has been modified, filtered, or removed. This ensures complete traceability and verifiability of the source data.`;
  }

  description += `

### Derivative Features
This derivative IP asset includes:
- **Complete Research Paper**: Comprehensive academic-style documentation with methodology, results, and analysis
- **AI-Enhanced Interpretation**: Natural language explanations of technical sensor data
- **Statistical Analysis**: Data trends, patterns, and agricultural insights
- **Contextual Information**: Historical data context and agricultural best practices
- **Machine-Readable Format**: Structured data optimized for AI processing and analysis
- **Full Parent Data Preservation**: All original sensor readings and metadata retained without modification
- **Enhanced Documentation**: Additional layers of analysis and interpretation built on top of original data

### Data Lineage & Provenance
- **Parent IP Asset ID**: ${parentIpId}
- **Derivation Type**: AI Research Analysis & Documentation
- **Data Preservation**: 100% of original parent data retained
- **Enhancement Type**: Non-destructive addition of research documentation and analysis`;

  if (parentCreatorAddress) {
    description += `
- **Original Data Creator**: ${parentCreatorAddress}
- **Attribution**: Full credit maintained to original data collector`;
  }

  description += `

### Use Cases
- Agricultural research and analysis
- Data-driven farming decisions
- Climate and environmental studies
- Machine learning training datasets
- Academic research and publications
- IoT system optimization
- Precision agriculture applications
- Weather pattern analysis
- Crop yield predictions
- Soil management optimization

### Technical Specifications
- **Data Format**: JSON with embedded research documentation
- **Encoding**: UTF-8
- **Timestamp Format**: ISO 8601
- **Geographic Coordinates**: Included in location metadata
- **Sensor Calibration**: Status and health metrics included
- **Data Completeness**: 100% (all parent data preserved)

### Blockchain Verification
All data is cryptographically verified and immutably stored on Story Protocol blockchain, ensuring:
- **Data Integrity**: Cryptographic hashing prevents tampering
- **Provenance Tracking**: Complete chain of custody from sensor to derivative
- **Authentic Attribution**: Verifiable creator and timestamp information
- **Immutability**: Once recorded, data cannot be altered or deleted
- **Transparency**: All transactions and data lineage publicly auditable

### Access & Licensing
This derivative IP asset can be licensed for:
- Commercial agricultural applications
- Research and academic purposes
- Machine learning model training
- Data aggregation and analytics services
- Integration into farming management systems
- Climate modeling and environmental monitoring

All licensing respects the terms of the parent IP asset while adding value through enhanced documentation and analysis.`;

  return description;
}

/**
 * Generate complete derivative IP metadata
 */
export function generateDerivativeIPMetadata(params: DerivativeMetadataParams): DerivativeIPMetadata {
  const title = generateDerivativeTitle(params.originalTitle, params.sensorType, params.location);
  const description = generateDerivativeDescription(params);
  
  return {
    title,
    description
  };
}

/**
 * Generate derivative NFT metadata with comprehensive attributes
 */
export function generateDerivativeNFTMetadata(params: DerivativeMetadataParams): DerivativeNFTMetadata {
  const { 
    originalTitle, 
    sensorType, 
    location, 
    timestamp, 
    sensorHealth, 
    parentIpId,
    rawData,
    creatorName,
    creatorAddress,
    parentCreatorAddress,
    dataSource,
    registrationDate
  } = params;
  
  const displayType = getSensorTypeDisplayName(sensorType);
  const title = generateDerivativeTitle(originalTitle, sensorType, location);
  const parentIpShort = `${parentIpId.slice(0, 10)}...${parentIpId.slice(-8)}`;
  
  const formattedDate = new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Build comprehensive description with all data preserved
  let description = `# Derivative Agricultural IoT Dataset with AI Research Analysis

**Asset Type**: Derivative IP with Comprehensive Research Documentation

**Original Data**: ${displayType} measurements collected from ${location} on ${formattedDate}

**Documentation**: This derivative IP asset includes a complete AI-generated research paper with:
- Detailed methodology and data collection protocols
- Statistical analysis and pattern recognition
- Agricultural insights and recommendations
- Machine-readable structured data formats
- Natural language interpretations for accessibility

**Parent IP**: This derivative is built upon parent IP asset ${parentIpShort}, preserving all original sensor data while adding enhanced analysis and research documentation.

**Data Preservation**: All sensor readings from the parent IP are preserved in their original form. No data has been modified, filtered, or removed.

**Full Parent IP Reference**: ${parentIpId}`;

  if (parentCreatorAddress) {
    description += `

**Original Data Creator**: ${parentCreatorAddress}
**Attribution**: Full credit maintained to original data collector and sensor operator.`;
  }

  if (creatorName) {
    description += `

**Derivative Creator**: ${creatorName}
**Derivative Enhancement**: AI-generated research documentation and analysis added as a non-destructive layer on top of original data.`;
  }

  // Add complete raw data preview
  if (rawData) {
    const dataPreview = rawData.length > 500 ? rawData.substring(0, 500) + '...[truncated for preview]' : rawData;
    description += `

---

## Complete Original Sensor Data (Preserved)

\`\`\`
${dataPreview}
\`\`\`

**Note**: The complete, unmodified sensor data is preserved in the derivative IP asset and accessible through the research paper documentation.`;
  }

  description += `

---

## Verification & Authenticity

**Blockchain Network**: Story Protocol
**Verification**: All data is cryptographically verified on-chain
**Provenance**: Complete chain of custody from sensor to derivative
**Immutability**: Data cannot be altered once registered
**Transparency**: All metadata and lineage publicly auditable

## Usage Rights

This derivative IP asset can be licensed for:
- Commercial agricultural applications
- Research and academic purposes  
- Machine learning model training
- Data analytics and aggregation
- Integration into farm management systems
- Climate modeling and environmental studies

All licensing respects the terms of the parent IP asset.`;

  
  // Build comprehensive attributes
  const attributes = [
    {
      trait_type: 'Asset Classification',
      value: 'Derivative IP Asset',
    },
    {
      trait_type: 'Content Type',
      value: 'AI-Generated Research Paper',
    },
    {
      trait_type: 'Sensor Type',
      value: displayType,
    },
    {
      trait_type: 'Original Sensor Type Code',
      value: sensorType,
    },
    {
      trait_type: 'Geographic Location',
      value: location,
    },
    {
      trait_type: 'Data Collection Date',
      value: formattedDate,
    },
    {
      trait_type: 'Data Collection Timestamp',
      value: timestamp,
    },
    {
      trait_type: 'Sensor Health Status',
      value: sensorHealth,
    },
    {
      trait_type: 'Data Source Platform',
      value: dataSource ? dataSource.toUpperCase() : 'IoT Network',
    },
    {
      trait_type: 'Documentation Format',
      value: 'Academic Research Paper',
    },
    {
      trait_type: 'Parent IP Reference',
      value: parentIpId,
    },
    {
      trait_type: 'Parent IP Short',
      value: parentIpShort,
    },
    {
      trait_type: 'Analysis Features',
      value: 'Statistical Analysis, Pattern Recognition, Agricultural Insights',
    },
    {
      trait_type: 'AI Processing',
      value: 'Natural Language Generation, Data Interpretation',
    },
    {
      trait_type: 'Data Format',
      value: 'Structured JSON with Research Documentation',
    },
    {
      trait_type: 'Data Preservation',
      value: '100% - All Parent Data Retained',
    },
    {
      trait_type: 'Blockchain Network',
      value: 'Story Protocol',
    },
    {
      trait_type: 'Original Data Title',
      value: originalTitle,
    },
  ];
  
  // Add optional attributes
  if (creatorName) {
    attributes.push({
      trait_type: 'Derivative Creator Name',
      value: creatorName,
    });
  }
  
  if (creatorAddress) {
    attributes.push({
      trait_type: 'Derivative Creator Address',
      value: creatorAddress,
    });
  }
  
  if (parentCreatorAddress) {
    attributes.push({
      trait_type: 'Original Data Creator',
      value: parentCreatorAddress,
    });
  }
  
  if (registrationDate) {
    attributes.push({
      trait_type: 'Derivative Registration Date',
      value: new Date(registrationDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    });
    attributes.push({
      trait_type: 'Derivative Registration Timestamp',
      value: registrationDate,
    });
  }
  
  // Add data insights as attribute
  if (rawData) {
    const insights = extractDataInsights(rawData, sensorType);
    attributes.push({
      trait_type: 'Data Insights',
      value: insights,
    });
    
    // Add data length info
    attributes.push({
      trait_type: 'Raw Data Length',
      value: `${rawData.length} characters`,
    });
    
    // Add data completeness
    attributes.push({
      trait_type: 'Data Completeness',
      value: '100% Complete',
    });
  }
  
  return {
    name: title,
    description,
    attributes
  };
}

/**
 * Generate enhanced derivative metadata with all context
 */
export function generateEnhancedDerivativeMetadata(params: DerivativeMetadataParams): {
  ipMetadata: DerivativeIPMetadata;
  nftMetadata: DerivativeNFTMetadata;
  displaySensorType: string;
} {
  const displaySensorType = getSensorTypeDisplayName(params.sensorType);
  
  const ipMetadata = generateDerivativeIPMetadata(params);
  const nftMetadata = generateDerivativeNFTMetadata(params);
  
  return {
    ipMetadata,
    nftMetadata,
    displaySensorType
  };
}

/**
 * Validate derivative metadata parameters
 */
export function validateDerivativeMetadataParams(params: Partial<DerivativeMetadataParams>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!params.originalTitle || params.originalTitle.trim().length === 0) {
    errors.push('Original title is required');
  }
  
  if (!params.sensorType || params.sensorType.trim().length === 0) {
    errors.push('Sensor type is required');
  }
  
  if (!params.location || params.location.trim().length === 0) {
    errors.push('Location is required');
  }
  
  if (!params.timestamp) {
    errors.push('Timestamp is required');
  } else {
    const date = new Date(params.timestamp);
    if (isNaN(date.getTime())) {
      errors.push('Invalid timestamp format');
    }
  }
  
  if (!params.sensorHealth || params.sensorHealth.trim().length === 0) {
    errors.push('Sensor health is required');
  }
  
  if (!params.parentIpId) {
    errors.push('Parent IP ID is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create derivative metadata summary for logging
 */
export function createMetadataSummary(
  ipMetadata: DerivativeIPMetadata,
  nftMetadata: DerivativeNFTMetadata
): string {
  return `
Derivative IP Metadata Summary:
================================
Title: ${ipMetadata.title}
Description Length: ${ipMetadata.description.length} characters
Description Preview: ${ipMetadata.description.substring(0, 150).replace(/\n/g, ' ')}...

NFT Name: ${nftMetadata.name}
NFT Description Length: ${nftMetadata.description.length} characters
Attributes: ${nftMetadata.attributes.length} traits defined

Key Attributes:
${nftMetadata.attributes
  .slice(0, 8)
  .map(attr => `  - ${attr.trait_type}: ${attr.value.substring(0, 50)}${attr.value.length > 50 ? '...' : ''}`)
  .join('\n')}

Total Attributes: ${nftMetadata.attributes.length}
`;
}

// Export a default service object with all functions
export const DerivativeMetadataService = {
  generateDerivativeTitle,
  generateDerivativeDescription,
  generateDerivativeIPMetadata,
  generateDerivativeNFTMetadata,
  getSensorTypeDisplayName,
  generateEnhancedDerivativeMetadata,
  validateDerivativeMetadataParams,
  createMetadataSummary,
  extractDataInsights,
};