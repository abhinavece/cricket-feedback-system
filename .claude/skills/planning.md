# Planning Skill

## Overview

Effective planning is critical for successful feature development. This skill establishes standards for creating, organizing, and maintaining planning documents.

## Guidelines

### Planning Documents

- **Location**: All planning files must be saved under `/plannings/` directory
- **Structure**: Use descriptive folder structure (e.g., `/plannings/auction-system/`)
- **Naming**: Use numbered prefixes for ordering (e.g., `001-design.md`, `002-api-spec.md`)
- **Format**: Markdown format with clear sections and hierarchy
- **Version Control**: All planning files must be checked into git

### Planning Process

1. **Discovery Phase**: 
   - Gather requirements from stakeholders
   - Ask clarifying questions to resolve ambiguities
   - Document assumptions and constraints

2. **Design Phase**:
   - Create comprehensive system design
   - Include data models, API contracts, state machines
   - Document edge cases and error handling
   - Plan testing strategy

3. **Review Phase**:
   - Present design for stakeholder review
   - Iterate based on feedback
   - Lock in final decisions before implementation

4. **Implementation Planning**:
   - Break down into logical phases
   - Define dependencies between phases
   - Plan testing at each phase

### Document Structure

Each planning document should include:

- **Executive Summary**: Brief overview of the feature
- **Requirements**: Functional and non-functional requirements
- **Architecture**: High-level system design
- **Data Models**: Database schemas and relationships
- **API Design**: Endpoints and contracts
- **Implementation Phases**: Step-by-step rollout plan
- **Testing Strategy**: Unit, integration, and edge case testing
- **Future Considerations**: Known limitations and future enhancements

### Best Practices

- **Be Specific**: Avoid vague descriptions. Use concrete examples.
- **Think Edge Cases**: Document unusual scenarios and how to handle them.
- **Version Decisions**: Track decision-making process and alternatives considered.
- **Include Mockups**: For UI-heavy features, include wireframes or mockups.
- **Plan for Testing**: Every feature needs a testing strategy.
- **Consider Performance**: Document performance requirements and how to achieve them.
- **Security First**: Include security considerations from the start.

### Review Process

Before implementation begins:

1. All questions must be answered
2. All ambiguities resolved
3. Stakeholder approval obtained
4. Implementation phases defined
5. Testing strategy documented

### Examples

See `/plannings/auction-system/001-cricsmart-auctions-design.md` for a comprehensive example following these guidelines.

---

**Remember**: Good planning prevents rework and ensures successful delivery. Take the time to plan thoroughly before writing any code.
