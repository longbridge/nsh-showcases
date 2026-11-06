# Onley

Onley finds duplicate files and photos on your own machine and removes the extra copies after you confirm. The interface is built with Native Shell.

## Find the duplicates

Choose a folder and start a scan on the desktop client, or scan the photo library on a phone. Onley compares file contents by hash instead of names, so renamed copies still match, and it groups every set of identical files. A scan resumes where it stopped because unchanged files are skipped.

## Decide what to keep

Each group shows its copies with the path, size and date. Keep the newest, the oldest or the first path for all groups, or select one copy per group. The policy stays available while a scan runs, and the choice applies again when the scan ends.

## Delete with one confirmation

Review collects the copies to delete and the copy to keep. Nothing is removed until you confirm. Onley removes folders that a cleanup empties, never the scan root, and never its own running program.

## Local by default

The index is a local SQLite database. There is no account, no telemetry and no cloud upload; a normal scan stays on the machine.

[Website](https://fdaio.github.io/onley/) · [GitHub repository](https://github.com/fdaio/onley)
