import { IDataWriter } from "../../../interfaces/IDataWriter";
import { SchemaContext } from "../../../types/ContextTypes";
import { MutationWriteTarget } from "../../../types/mutation/MutationWriteTargetTypes";
import { TraceLogger } from "../../logging/TraceLogger";

export class DataMutationWriter {

    constructor(
        private writer: IDataWriter,
        private contextResolver: (
            schemaName: string
        ) => Promise<SchemaContext>,
        private trace: TraceLogger
    ) {}

    async save(
        targets: MutationWriteTarget[]
    ): Promise<void> {

        const grouped =
            new Map<
                string,
                Map<string, MutationWriteTarget>
            >();

        for (const target of targets) {

            let schemaTargets =
                grouped.get(
                    target.schemaName
                );

            if (!schemaTargets) {

                schemaTargets =
                    new Map();

                grouped.set(
                    target.schemaName,
                    schemaTargets
                );
            }

            schemaTargets.set(
                target.record.id,
                target
            );
        }


        for (
            const [
                schemaName,
                schemaTargets
            ]
            of grouped
        ) {

            const context =
                await this.contextResolver(
                    schemaName
                );


            await this.writer.saveRecords(
                context,
                [
                    ...schemaTargets.values()
                ]
                .map(
                    x => x.record
                )
            );
        }
    }
}