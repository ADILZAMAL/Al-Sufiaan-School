import { DataTypes, Model, Sequelize } from 'sequelize';
import Subject from './Subject';
import Staff from './Staff';
import Section from './Section';
import AcademicSession from './AcademicSession';
import User from './User';

class TeacherSubjectAssignment extends Model {
  public id!: number;
  public schoolId!: number;
  public subjectId!: number;
  public staffId!: number;
  public sectionId!: number;
  public sessionId!: number;
  public assignedBy!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initTeacherSubjectAssignmentModel = (sequelize: Sequelize) => {
  TeacherSubjectAssignment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subjectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Subject, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      staffId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Staff, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      sectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Section, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: AcademicSession, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      assignedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'TeacherSubjectAssignment',
      tableName: 'teacher_subject_assignments',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['subjectId', 'sectionId', 'sessionId'],
          name: 'teacher_subject_assignment_unique_index',
        },
        {
          fields: ['staffId', 'sessionId'],
          name: 'teacher_subject_assignment_staff_session_index',
        },
      ],
    }
  );
};

export default TeacherSubjectAssignment;
