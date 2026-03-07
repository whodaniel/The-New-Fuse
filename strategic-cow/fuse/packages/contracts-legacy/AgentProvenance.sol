// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title AgentProvenance
 * @dev Tracks lineage and relationships between Agent NFTs for multi-generational royalties
 * 
 * Features:
 * - Complete agent lineage tracking (parent-child relationships)
 * - Multi-generational provenance chains
 * - Training data attribution and compensation
 * - Collaboration tracking between agents
 * - Immutable provenance records
 * - Gas-efficient lineage queries
 * 
 * This contract enables fair attribution and compensation across agent families,
 * ensuring creators are rewarded when their work influences future agents.
 */
contract AgentProvenance is AccessControl, Pausable, ReentrancyGuard {
    
    // ============ State Variables ============
    
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    
    enum RelationshipType {
        Parent,          // Direct training relationship
        Collaboration,   // Joint creation
        Inspiration,     // Influenced by but not direct training
        Fork,           // Code/model fork
        Merge           // Multiple agents merged into one
    }
    
    struct ProvenanceRecord {
        uint256 childTokenId;           // Child agent NFT token ID
        uint256 parentTokenId;          // Parent agent NFT token ID
        RelationshipType relationship;   // Type of relationship
        uint256 contributionPercentage; // Contribution percentage (basis points)
        uint256 timestamp;              // When relationship was established
        string metadataURI;             // Additional metadata (IPFS)
        address verifier;               // Who verified this relationship
        bool isActive;                  // Whether relationship is active
    }
    
    struct AgentLineage {
        uint256[] parents;              // Direct parent token IDs
        uint256[] children;             // Direct child token IDs
        uint256 totalContributions;     // Total contribution percentage received
        uint256 generation;             // Generation level (0 = genesis)
        bool isGenesis;                 // Whether this is a genesis agent
        string creationMetadata;        // Creation process metadata
    }
    
    struct CollaborationGroup {
        uint256[] agentTokenIds;        // Agents in collaboration
        uint256 outputTokenId;          // Resulting agent token ID
        mapping(uint256 => uint256) contributions; // tokenId => contribution percentage
        uint256 timestamp;              // When collaboration occurred
        string collaborationURI;        // Collaboration details
        bool isActive;                  // Whether collaboration is active
    }
    
    // ============ Mappings & Storage ============
    
    mapping(uint256 => AgentLineage) public agentLineages;
    mapping(uint256 => ProvenanceRecord[]) public agentProvenance; // childId => records
    mapping(uint256 => CollaborationGroup) public collaborations;
    mapping(bytes32 => bool) public recordHashes; // Prevent duplicate records
    mapping(address => bool) public trustedVerifiers;
    
    uint256 public nextCollaborationId;
    uint256 public totalProvenanceRecords;
    address public agentNFTContract;
    
    // Constants
    uint256 public constant MAX_CONTRIBUTION_PERCENTAGE = 10000; // 100% in basis points
    uint256 public constant MAX_PARENTS_PER_AGENT = 10;
    uint256 public constant MAX_COLLABORATION_SIZE = 5;
    
    // ============ Events ============
    
    event ProvenanceRecorded(
        uint256 indexed childTokenId,
        uint256 indexed parentTokenId,
        RelationshipType relationship,
        uint256 contributionPercentage,
        address indexed verifier
    );
    
    event CollaborationCreated(
        uint256 indexed collaborationId,
        uint256 indexed outputTokenId,
        uint256[] agentTokenIds,
        uint256[] contributions
    );
    
    event LineageUpdated(
        uint256 indexed tokenId,
        uint256 generation,
        uint256 totalContributions
    );
    
    event TrustedVerifierUpdated(
        address indexed verifier,
        bool trusted
    );
    
    event ProvenanceVerified(
        uint256 indexed childTokenId,
        uint256 indexed parentTokenId,
        address indexed verifier
    );
    
    // ============ Constructor ============
    
    constructor(
        address defaultAdmin,
        address _agentNFTContract
    ) {
        require(_agentNFTContract != address(0), "AgentProvenance: Invalid NFT contract");
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ORACLE_ROLE, defaultAdmin);
        _grantRole(REGISTRAR_ROLE, defaultAdmin);
        
        agentNFTContract = _agentNFTContract;
        nextCollaborationId = 1;
        trustedVerifiers[defaultAdmin] = true;
    }
    
    // ============ Core Provenance Functions ============
    
    /**
     * @dev Record a provenance relationship between agents
     * @param childTokenId The child agent token ID
     * @param parentTokenId The parent agent token ID
     * @param relationship Type of relationship
     * @param contributionPercentage Contribution percentage in basis points
     * @param metadataURI Additional metadata URI
     */
    function recordProvenance(
        uint256 childTokenId,
        uint256 parentTokenId,
        RelationshipType relationship,
        uint256 contributionPercentage,
        string calldata metadataURI
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(childTokenId != parentTokenId, "AgentProvenance: Cannot be own parent");
        require(contributionPercentage > 0 && contributionPercentage <= MAX_CONTRIBUTION_PERCENTAGE, 
                "AgentProvenance: Invalid contribution percentage");
        require(_tokenExists(childTokenId), "AgentProvenance: Child token does not exist");
        require(_tokenExists(parentTokenId), "AgentProvenance: Parent token does not exist");
        
        // Prevent duplicate records
        bytes32 recordHash = keccak256(abi.encodePacked(childTokenId, parentTokenId, relationship));
        require(!recordHashes[recordHash], "AgentProvenance: Duplicate record");
        
        AgentLineage storage childLineage = agentLineages[childTokenId];
        AgentLineage storage parentLineage = agentLineages[parentTokenId];
        
        // Check constraints
        require(childLineage.parents.length < MAX_PARENTS_PER_AGENT, "AgentProvenance: Too many parents");
        require(childLineage.totalContributions + contributionPercentage <= MAX_CONTRIBUTION_PERCENTAGE,
                "AgentProvenance: Total contributions exceed 100%");
        
        // Prevent circular dependencies
        require(!_hasAncestor(parentTokenId, childTokenId), "AgentProvenance: Circular dependency");
        
        // Create provenance record
        ProvenanceRecord memory record = ProvenanceRecord({
            childTokenId: childTokenId,
            parentTokenId: parentTokenId,
            relationship: relationship,
            contributionPercentage: contributionPercentage,
            timestamp: block.timestamp,
            metadataURI: metadataURI,
            verifier: msg.sender,
            isActive: true
        });
        
        agentProvenance[childTokenId].push(record);
        recordHashes[recordHash] = true;
        totalProvenanceRecords++;
        
        // Update lineages
        childLineage.parents.push(parentTokenId);
        childLineage.totalContributions += contributionPercentage;
        
        parentLineage.children.push(childTokenId);
        
        // Calculate generation
        if (childLineage.generation == 0) {
            childLineage.generation = parentLineage.generation + 1;
        }
        
        emit ProvenanceRecorded(
            childTokenId,
            parentTokenId,
            relationship,
            contributionPercentage,
            msg.sender
        );
        
        emit LineageUpdated(childTokenId, childLineage.generation, childLineage.totalContributions);
    }
    
    /**
     * @dev Record a collaboration between multiple agents
     * @param agentTokenIds Array of collaborating agent token IDs
     * @param outputTokenId The resulting agent token ID
     * @param contributions Array of contribution percentages
     * @param collaborationURI Collaboration metadata URI
     * @return collaborationId The created collaboration ID
     */
    function recordCollaboration(
        uint256[] calldata agentTokenIds,
        uint256 outputTokenId,
        uint256[] calldata contributions,
        string calldata collaborationURI
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused returns (uint256 collaborationId) {
        require(agentTokenIds.length > 1, "AgentProvenance: Need multiple agents");
        require(agentTokenIds.length <= MAX_COLLABORATION_SIZE, "AgentProvenance: Too many collaborators");
        require(agentTokenIds.length == contributions.length, "AgentProvenance: Array length mismatch");
        require(_tokenExists(outputTokenId), "AgentProvenance: Output token does not exist");
        
        uint256 totalContribution = 0;
        for (uint256 i = 0; i < contributions.length; i++) {
            require(_tokenExists(agentTokenIds[i]), "AgentProvenance: Agent token does not exist");
            require(contributions[i] > 0, "AgentProvenance: Invalid contribution");
            totalContribution += contributions[i];
        }
        require(totalContribution == MAX_CONTRIBUTION_PERCENTAGE, "AgentProvenance: Contributions must sum to 100%");
        
        collaborationId = nextCollaborationId++;
        CollaborationGroup storage collaboration = collaborations[collaborationId];
        
        collaboration.agentTokenIds = agentTokenIds;
        collaboration.outputTokenId = outputTokenId;
        collaboration.timestamp = block.timestamp;
        collaboration.collaborationURI = collaborationURI;
        collaboration.isActive = true;
        
        // Set contributions
        for (uint256 i = 0; i < agentTokenIds.length; i++) {
            collaboration.contributions[agentTokenIds[i]] = contributions[i];
            
            // Record individual provenance relationships
            recordProvenance(
                outputTokenId,
                agentTokenIds[i],
                RelationshipType.Collaboration,
                contributions[i],
                collaborationURI
            );
        }
        
        emit CollaborationCreated(collaborationId, outputTokenId, agentTokenIds, contributions);
        
        return collaborationId;
    }
    
    /**
     * @dev Mark an agent as genesis (no parents)
     * @param tokenId The agent token ID
     * @param creationMetadata Creation process metadata
     */
    function markAsGenesis(
        uint256 tokenId,
        string calldata creationMetadata
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(_tokenExists(tokenId), "AgentProvenance: Token does not exist");
        
        AgentLineage storage lineage = agentLineages[tokenId];
        require(lineage.parents.length == 0, "AgentProvenance: Agent already has parents");
        
        lineage.isGenesis = true;
        lineage.generation = 0;
        lineage.creationMetadata = creationMetadata;
        
        emit LineageUpdated(tokenId, 0, 0);
    }
    
    /**
     * @dev Verify a provenance record
     * @param childTokenId The child agent token ID
     * @param parentTokenId The parent agent token ID
     */
    function verifyProvenance(
        uint256 childTokenId,
        uint256 parentTokenId
    ) external whenNotPaused {
        require(trustedVerifiers[msg.sender], "AgentProvenance: Not trusted verifier");
        require(_hasDirectParent(childTokenId, parentTokenId), "AgentProvenance: No such relationship");
        
        emit ProvenanceVerified(childTokenId, parentTokenId, msg.sender);
    }
    
    // ============ Query Functions ============
    
    /**
     * @dev Get complete lineage for an agent
     * @param tokenId The agent token ID
     * @return parents Array of parent token IDs
     * @return children Array of child token IDs
     * @return generation Generation level
     * @return isGenesis Whether agent is genesis
     */
    function getAgentLineage(uint256 tokenId)
        external
        view
        returns (
            uint256[] memory parents,
            uint256[] memory children,
            uint256 generation,
            bool isGenesis
        )
    {
        AgentLineage storage lineage = agentLineages[tokenId];
        return (lineage.parents, lineage.children, lineage.generation, lineage.isGenesis);
    }
    
    /**
     * @dev Get all provenance records for an agent
     * @param tokenId The agent token ID
     * @return records Array of provenance records
     */
    function getProvenanceRecords(uint256 tokenId)
        external
        view
        returns (ProvenanceRecord[] memory records)
    {
        return agentProvenance[tokenId];
    }
    
    /**
     * @dev Get collaboration information
     * @param collaborationId The collaboration ID
     * @return agentTokenIds Array of collaborating agents
     * @return outputTokenId The resulting agent
     * @return timestamp When collaboration occurred
     * @return collaborationURI Collaboration metadata
     */
    function getCollaboration(uint256 collaborationId)
        external
        view
        returns (
            uint256[] memory agentTokenIds,
            uint256 outputTokenId,
            uint256 timestamp,
            string memory collaborationURI
        )
    {
        CollaborationGroup storage collaboration = collaborations[collaborationId];
        return (
            collaboration.agentTokenIds,
            collaboration.outputTokenId,
            collaboration.timestamp,
            collaboration.collaborationURI
        );
    }
    
    /**
     * @dev Get contribution percentage for an agent in a collaboration
     * @param collaborationId The collaboration ID
     * @param agentTokenId The agent token ID
     * @return contribution The contribution percentage
     */
    function getCollaborationContribution(
        uint256 collaborationId,
        uint256 agentTokenId
    ) external view returns (uint256 contribution) {
        return collaborations[collaborationId].contributions[agentTokenId];
    }
    
    /**
     * @dev Get all ancestors of an agent (recursive)
     * @param tokenId The agent token ID
     * @param maxDepth Maximum depth to search
     * @return ancestors Array of ancestor token IDs
     */
    function getAncestors(uint256 tokenId, uint256 maxDepth)
        external
        view
        returns (uint256[] memory ancestors)
    {
        return _getAncestorsRecursive(tokenId, maxDepth, 0);
    }
    
    /**
     * @dev Get all descendants of an agent (recursive)
     * @param tokenId The agent token ID
     * @param maxDepth Maximum depth to search
     * @return descendants Array of descendant token IDs
     */
    function getDescendants(uint256 tokenId, uint256 maxDepth)
        external
        view
        returns (uint256[] memory descendants)
    {
        return _getDescendantsRecursive(tokenId, maxDepth, 0);
    }
    
    /**
     * @dev Check if an agent has a specific ancestor
     * @param tokenId The agent token ID
     * @param ancestorId The potential ancestor token ID
     * @return hasAncestor Whether the ancestor relationship exists
     */
    function hasAncestor(uint256 tokenId, uint256 ancestorId)
        external
        view
        returns (bool hasAncestor)
    {
        return _hasAncestor(tokenId, ancestorId);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update trusted verifier status
     * @param verifier The verifier address
     * @param trusted Whether verifier is trusted
     */
    function setTrustedVerifier(address verifier, bool trusted)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        trustedVerifiers[verifier] = trusted;
        emit TrustedVerifierUpdated(verifier, trusted);
    }
    
    /**
     * @dev Emergency pause functionality
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Check if token exists
     */
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        try IERC721(agentNFTContract).ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Check if agent has direct parent
     */
    function _hasDirectParent(uint256 childId, uint256 parentId) internal view returns (bool) {
        uint256[] storage parents = agentLineages[childId].parents;
        for (uint256 i = 0; i < parents.length; i++) {
            if (parents[i] == parentId) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Check for ancestor relationship (recursive)
     */
    function _hasAncestor(uint256 tokenId, uint256 ancestorId) internal view returns (bool) {
        if (tokenId == ancestorId) return true;
        
        uint256[] storage parents = agentLineages[tokenId].parents;
        for (uint256 i = 0; i < parents.length; i++) {
            if (_hasAncestor(parents[i], ancestorId)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Get ancestors recursively
     */
    function _getAncestorsRecursive(
        uint256 tokenId,
        uint256 maxDepth,
        uint256 currentDepth
    ) internal view returns (uint256[] memory) {
        if (currentDepth >= maxDepth) {
            return new uint256[](0);
        }
        
        uint256[] storage parents = agentLineages[tokenId].parents;
        if (parents.length == 0) {
            return new uint256[](0);
        }
        
        // Calculate total size needed
        uint256 totalSize = parents.length;
        for (uint256 i = 0; i < parents.length; i++) {
            uint256[] memory subAncestors = _getAncestorsRecursive(parents[i], maxDepth, currentDepth + 1);
            totalSize += subAncestors.length;
        }
        
        uint256[] memory ancestors = new uint256[](totalSize);
        uint256 index = 0;
        
        // Add direct parents
        for (uint256 i = 0; i < parents.length; i++) {
            ancestors[index++] = parents[i];
        }
        
        // Add recursive ancestors
        for (uint256 i = 0; i < parents.length; i++) {
            uint256[] memory subAncestors = _getAncestorsRecursive(parents[i], maxDepth, currentDepth + 1);
            for (uint256 j = 0; j < subAncestors.length; j++) {
                ancestors[index++] = subAncestors[j];
            }
        }
        
        return ancestors;
    }
    
    /**
     * @dev Get descendants recursively
     */
    function _getDescendantsRecursive(
        uint256 tokenId,
        uint256 maxDepth,
        uint256 currentDepth
    ) internal view returns (uint256[] memory) {
        if (currentDepth >= maxDepth) {
            return new uint256[](0);
        }
        
        uint256[] storage children = agentLineages[tokenId].children;
        if (children.length == 0) {
            return new uint256[](0);
        }
        
        // Calculate total size needed
        uint256 totalSize = children.length;
        for (uint256 i = 0; i < children.length; i++) {
            uint256[] memory subDescendants = _getDescendantsRecursive(children[i], maxDepth, currentDepth + 1);
            totalSize += subDescendants.length;
        }
        
        uint256[] memory descendants = new uint256[](totalSize);
        uint256 index = 0;
        
        // Add direct children
        for (uint256 i = 0; i < children.length; i++) {
            descendants[index++] = children[i];
        }
        
        // Add recursive descendants
        for (uint256 i = 0; i < children.length; i++) {
            uint256[] memory subDescendants = _getDescendantsRecursive(children[i], maxDepth, currentDepth + 1);
            for (uint256 j = 0; j < subDescendants.length; j++) {
                descendants[index++] = subDescendants[j];
            }
        }
        
        return descendants;
    }
}